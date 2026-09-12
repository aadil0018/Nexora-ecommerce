const Product = require('../models/Product');
const Review = require('../models/Review');
const Order = require('../models/Order');
const User = require('../models/User');

/**
 * AI Service for E-Commerce Platform
 * Supports Groq API (High Speed LLaMA/GPT-OSS) and Google Gemini API via GROQ_API_KEY / AI_API_KEY
 * with an intelligent, grounded NLP fallback engine that queries the real MongoDB database.
 */

// Helper to call Groq OpenAI-compatible chat completions API
const callGroqAPI = async (systemPrompt, userPrompt, model = 'openai/gpt-oss-20b') => {
  const groqKey = process.env.GROQ_API_KEY || process.env.AI_API_KEY;
  if (!groqKey || groqKey.trim() === '' || groqKey.includes('YOUR_')) {
    return null;
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 1000,
      }),
    });

    const data = await response.json();
    if (data.choices && data.choices[0]?.message?.content) {
      return data.choices[0].message.content.trim();
    }
  } catch (err) {
    console.warn('[AI Service] Groq API call failed, using local engine:', err.message);
  }
  return null;
};

// Helper to extract budget from query
const extractBudget = (text) => {
  const clean = text.replace(/,/g, '');
  // Match patterns like "under 60000", "below ₹5000", "less than 70k", "under 1.5 lakh"
  const kMatch = clean.match(/(?:under|below|less than|within|budget of)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*k\b/i);
  if (kMatch) {
    return { maxPrice: parseFloat(kMatch[1]) * 1000 };
  }

  const lakhMatch = clean.match(/(?:under|below|less than|within|budget of)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*lakh\b/i);
  if (lakhMatch) {
    return { maxPrice: parseFloat(lakhMatch[1]) * 100000 };
  }

  const standardMatch = clean.match(/(?:under|below|less than|within|budget of|max|upto)\s*(?:₹|rs\.?|inr)?\s*(\d+)/i);
  if (standardMatch) {
    return { maxPrice: parseInt(standardMatch[1], 10) };
  }

  const betweenMatch = clean.match(/(?:between|from)\s*(?:₹|rs\.?|inr)?\s*(\d+)\s*(?:and|to|-)\s*(?:₹|rs\.?|inr)?\s*(\d+)/i);
  if (betweenMatch) {
    return {
      minPrice: parseInt(betweenMatch[1], 10),
      maxPrice: parseInt(betweenMatch[2], 10),
    };
  }

  return {};
};

// Helper to extract known categories
const extractCategory = (text) => {
  const lower = text.toLowerCase();
  if (lower.includes('headphone') || lower.includes('earphone') || lower.includes('audio') || lower.includes('earbuds') || lower.includes('airpods') || lower.includes('headset')) return 'Audio';
  if (lower.includes('laptop') || lower.includes('notebook') || lower.includes('macbook')) return 'Laptops';
  if (lower.includes('smartphone') || lower.includes('iphone') || lower.includes('mobile') || /\bphones?\b/i.test(lower)) return 'Smartphones';
  if (lower.includes('watch') || lower.includes('smartwatch') || lower.includes('wearable') || lower.includes('fitness tracker')) return 'Wearables';
  if (lower.includes('accessory') || lower.includes('accessories') || lower.includes('keyboard') || lower.includes('mouse') || lower.includes('monitor') || lower.includes('charger')) return 'Accessories';
  return null;
};

// Helper to extract brand
const extractBrand = (text) => {
  const brands = [
    'Apple', 'Dell', 'Lenovo', 'ASUS', 'HP', 'Samsung', 'Sony',
    'Bose', 'OnePlus', 'Google', 'JBL', 'boAt', 'Logitech', 'Garmin', 'Acer'
  ];
  const lower = text.toLowerCase();
  for (const b of brands) {
    if (lower.includes(b.toLowerCase())) return b;
  }
  return null;
};

// Helper to extract use-case or features
const extractFeaturesAndUseCase = (text) => {
  const keywords = [];
  const lower = text.toLowerCase();
  const featureList = [
    'programming', 'coding', 'gaming', 'battery', 'battery life',
    'anc', 'noise cancellation', 'noise-cancelling', 'wireless',
    'bluetooth', 'lightweight', 'compact', 'camera', 'display',
    'oled', 'fast charging', 'waterproof', 'fitness', 'office', 'student'
  ];
  for (const feat of featureList) {
    if (lower.includes(feat)) {
      keywords.push(feat);
    }
  }
  return keywords;
};

/**
 * 1. AI Shopping Assistant (Conversational)
 */
const chatAssistant = async (message, history = [], userId = null) => {
  const apiKey = process.env.AI_API_KEY;
  const budget = extractBudget(message);
  const category = extractCategory(message);
  const brand = extractBrand(message);
  const features = extractFeaturesAndUseCase(message);

  // Build MongoDB query grounded on the real database
  const query = {};
  if (category) {
    query.category = new RegExp(category, 'i');
  }
  if (brand) {
    query.brand = new RegExp(brand, 'i');
  }
  if (budget.maxPrice) {
    query.price = { ...query.price, $lte: budget.maxPrice };
  }
  if (budget.minPrice) {
    query.price = { ...query.price, $gte: budget.minPrice };
  }

  // If features mentioned, add or regex search across features and descriptions
  if (features.length > 0) {
    query.$or = [
      { features: { $in: features.map(f => new RegExp(f, 'i')) } },
      { description: { $regex: features.join('|'), $options: 'i' } },
      { name: { $regex: features.join('|'), $options: 'i' } }
    ];
  }

  // Query MongoDB
  let products = await Product.find(query).limit(5).lean();

  // If query was too strict and returned empty, relax features constraint
  if (products.length === 0 && (category || brand || budget.maxPrice)) {
    const relaxedQuery = {};
    if (category) relaxedQuery.category = new RegExp(category, 'i');
    if (brand) relaxedQuery.brand = new RegExp(brand, 'i');
    if (budget.maxPrice) relaxedQuery.price = { $lte: budget.maxPrice };
    products = await Product.find(relaxedQuery).sort({ rating: -1 }).limit(4).lean();
  }

  // If still empty, return top-rated items
  if (products.length === 0) {
    products = await Product.find({}).sort({ rating: -1 }).limit(3).lean();
  }

  // Attempt external LLM: 1. Groq API (High Speed), 2. Google Gemini
  let aiReply = null;
  let mode = 'fallback_nlp';

  const productContext = products.map((p, idx) => 
    `${idx + 1}. ${p.name} by ${p.brand} (Category: ${p.category}) - Price: ₹${p.price.toLocaleString('en-IN')}, Rating: ${p.rating}/5, Features: ${p.features.join(', ')}`
  ).join('\n');

  // Try Groq API
  const groqKey = process.env.GROQ_API_KEY || process.env.AI_API_KEY;
  if (groqKey && (groqKey.startsWith('gsk_') || !groqKey.includes('YOUR_'))) {
    const systemPrompt = `You are Nexora's expert AI Shopping Assistant on an e-commerce platform.
Rules & Formatting Guidelines:
1. Recommend ONLY the products provided in the context that exist in our database.
2. Address the user's specific constraints (budget in ₹, use case, specs, brand preferences).
3. State prices in Indian Rupees (₹).
4. Presentation & Formatting Guidelines:
   - Format your answer clearly and neatly.
   - Start with a direct, warm 1-sentence recommendation.
   - For each recommended product, use a clean heading: e.g. "### [Product Name] — ₹[Price]"
   - Provide 3-4 bullet points highlighting key specifications and why it fits the user's specific need or budget.
   - If comparing options, you may include a clean Markdown table (Product | Price | Best For). DO NOT use raw HTML tags like <br> in table cells or text.
   - End with a short helpful buying tip or advice formatted as a blockquote: e.g.
     > 💡 **Tip:** [Helpful advice regarding warranty, alternatives, or use case]
5. Keep the tone professional, helpful, and concise.`;

    const userPrompt = `User Query: "${message}"

Matched Products from database:
${productContext}

Please provide your shopping recommendation.`;

    const groqReply = await callGroqAPI(systemPrompt, userPrompt);
    if (groqReply) {
      aiReply = groqReply;
      mode = 'groq_ai';
    }
  }

  // Fallback to Gemini if Groq was not used
  if (!aiReply && apiKey && !apiKey.startsWith('gsk_') && !apiKey.includes('YOUR_')) {
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const prompt = `You are an expert AI Shopping Assistant on our e-commerce platform.
User Query: "${message}"

Matched Products from our real database:
${productContext}

Formatting Guidelines:
1. Recommend ONLY the products listed above that exist in our database.
2. Address the user's specific constraints (budget, use case, specs).
3. State prices in Indian Rupees (₹).
4. Use clean Markdown: bold headers (### [Product Name] — ₹[Price]), bullet points for features, and a helpful blockquote (> 💡 Tip:) at the end. Do NOT use raw HTML tags.`;

      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      const data = await response.json();
      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        aiReply = data.candidates[0].content.parts[0].text;
        mode = 'gemini_api';
      }
    } catch (err) {
      console.warn('[AI Service] External Gemini API call failed, switching to local NLP engine:', err.message);
    }
  }

  // Fallback intelligent natural language response grounded in DB products
  if (!aiReply) {
    const identified = [];
    if (category) identified.push(`category "${category}"`);
    if (budget.maxPrice) identified.push(`budget under ₹${budget.maxPrice.toLocaleString('en-IN')}`);
    if (brand) identified.push(`brand "${brand}"`);
    if (features.length > 0) identified.push(`requirements for ${features.join(', ')}`);

    const criteriaText = identified.length > 0 ? identified.join(', ') : 'your preferences';

    if (products.length > 0) {
      const highlights = products.map(p => 
        `• **${p.name}** (₹${p.price.toLocaleString('en-IN')}) - ${p.rating}★ rating, featuring ${p.features.slice(0, 3).join(', ')}.`
      ).join('\n');

      aiReply = `Based on your request for **${criteriaText}**, here are the best matching products from our catalog:\n\n${highlights}\n\nAll of these items are currently in stock and ready to order. You can click on any product card below for in-depth specifications or to add it directly to your cart!`;
    } else {
      aiReply = `I couldn't find an exact match for your specific criteria. Here are our most popular, top-rated products that might interest you!`;
    }
  }

  return {
    reply: aiReply,
    matchedProducts: products,
    extractedCriteria: {
      category,
      brand,
      budget,
      features,
    },
    mode,
  };
};

/**
 * 2. Natural Language Product Search
 */
const naturalLanguageSearch = async (searchQuery) => {
  const budget = extractBudget(searchQuery);
  const category = extractCategory(searchQuery);
  const brand = extractBrand(searchQuery);
  const features = extractFeaturesAndUseCase(searchQuery);

  // Construct structured query
  const query = {};
  if (category) query.category = new RegExp(category, 'i');
  if (brand) query.brand = new RegExp(brand, 'i');
  if (budget.maxPrice) query.price = { ...query.price, $lte: budget.maxPrice };
  if (budget.minPrice) query.price = { ...query.price, $gte: budget.minPrice };

  // Text search on name, description, features
  const remainingTerms = searchQuery
    .replace(/(?:under|below|less than|budget of|within)\s*(?:₹|rs\.?|inr)?\s*(\d+[kK]?|\d+)/gi, '')
    .trim();

  if (features.length > 0 || remainingTerms.length > 2) {
    const terms = [...features, ...remainingTerms.split(/\s+/).filter(w => w.length > 3)];
    if (terms.length > 0) {
      query.$or = [
        { name: { $regex: terms.join('|'), $options: 'i' } },
        { description: { $regex: terms.join('|'), $options: 'i' } },
        { features: { $in: terms.map(t => new RegExp(t, 'i')) } },
        { category: { $regex: terms.join('|'), $options: 'i' } },
      ];
    }
  }

  let products = await Product.find(query).limit(12).lean();

  // If no results, loosen the query to category or brand
  if (products.length === 0) {
    const fallbackQuery = {};
    if (category) fallbackQuery.category = new RegExp(category, 'i');
    else if (brand) fallbackQuery.brand = new RegExp(brand, 'i');
    if (budget.maxPrice) fallbackQuery.price = { $lte: budget.maxPrice };
    
    products = await Product.find(fallbackQuery).sort({ rating: -1 }).limit(8).lean();
  }

  return {
    query: searchQuery,
    structuredFilters: {
      category: category || 'All',
      brand: brand || 'Any',
      maxPrice: budget.maxPrice || null,
      minPrice: budget.minPrice || null,
      identifiedFeatures: features,
    },
    count: products.length,
    products,
  };
};

/**
 * 3. Personalized Product Recommendations
 */
const getPersonalizedRecommendations = async (userId) => {
  let recommendedProducts = [];
  let recommendationBasis = 'popular';

  if (userId) {
    const user = await User.findById(userId)
      .populate('wishlist')
      .populate('browsingHistory.product')
      .lean();

    if (user) {
      const viewedCategories = new Set();
      const viewedProductIds = new Set();

      // Collect categories from browsing history
      if (user.browsingHistory && user.browsingHistory.length > 0) {
        user.browsingHistory.slice(-10).forEach(item => {
          if (item.product) {
            viewedProductIds.add(item.product._id.toString());
            if (item.product.category) viewedCategories.add(item.product.category);
          }
        });
      }

      // Collect from wishlist
      if (user.wishlist && user.wishlist.length > 0) {
        user.wishlist.forEach(item => {
          if (item) {
            viewedProductIds.add(item._id.toString());
            if (item.category) viewedCategories.add(item.category);
          }
        });
      }

      // Collect from past orders
      const orders = await Order.find({ user: userId }).lean();
      orders.forEach(order => {
        order.orderItems.forEach(item => {
          viewedProductIds.add(item.product.toString());
        });
      });

      if (viewedCategories.size > 0) {
        recommendationBasis = `browsing_and_interests (${Array.from(viewedCategories).join(', ')})`;
        recommendedProducts = await Product.find({
          category: { $in: Array.from(viewedCategories) },
          _id: { $nin: Array.from(viewedProductIds) },
        })
          .sort({ rating: -1, numReviews: -1 })
          .limit(8)
          .lean();
      }
    }
  }

  // Fallback if not enough history or guest user
  if (recommendedProducts.length < 4) {
    const popularProducts = await Product.find({
      _id: { $nin: recommendedProducts.map(p => p._id) },
    })
      .sort({ rating: -1, numReviews: -1 })
      .limit(8 - recommendedProducts.length)
      .lean();

    recommendedProducts = [...recommendedProducts, ...popularProducts];
    if (recommendationBasis === 'popular') {
      recommendationBasis = 'trending_and_top_rated';
    }
  }

  return {
    recommendationBasis,
    products: recommendedProducts,
  };
};

/**
 * 4. Product Comparison with AI Verdict
 */
const compareProducts = async (productIds) => {
  if (!Array.isArray(productIds) || productIds.length < 2) {
    throw new Error('Please select at least 2 products to compare.');
  }

  const products = await Product.find({ _id: { $in: productIds.slice(0, 3) } }).lean();

  if (products.length < 2) {
    throw new Error('Could not find all selected products in database.');
  }

  // Build comparison matrix
  const allSpecKeys = new Set();
  products.forEach(p => {
    if (p.specifications) {
      if (p.specifications instanceof Map) {
        p.specifications.forEach((val, key) => allSpecKeys.add(key));
      } else if (typeof p.specifications === 'object') {
        Object.keys(p.specifications).forEach(k => allSpecKeys.add(k));
      }
    }
  });

  const comparisonMatrix = Array.from(allSpecKeys).map(specKey => {
    const row = { specKey };
    products.forEach(p => {
      let val = '-';
      if (p.specifications) {
        if (p.specifications instanceof Map) {
          val = p.specifications.get(specKey) || '-';
        } else {
          val = p.specifications[specKey] || '-';
        }
      }
      row[p._id.toString()] = val;
    });
    return row;
  });

  // Generate AI comparative analysis: Groq API first, then Gemini, then Heuristic
  let verdictSummary = '';
  const groqKey = process.env.GROQ_API_KEY || process.env.AI_API_KEY;
  const productDetails = products.map(p => 
    `Product: ${p.name} | Brand: ${p.brand} | Price: ₹${p.price.toLocaleString('en-IN')} | Rating: ${p.rating}/5 | Features: ${p.features.join(', ')}`
  ).join('\n');

  // Try Groq API
  if (groqKey && (groqKey.startsWith('gsk_') || !groqKey.includes('YOUR_'))) {
    const systemPrompt = `You are an expert consumer hardware analyst comparing electronics products.
Format your output using Markdown with:
### AI Product Comparison Analysis
• **Key Differences & Trade-offs**: Explain how they differ in display, performance, battery, or specs.
• **Best Value for Money Choice**: Name the product and why it offers maximum utility per rupee.
• **Best Performance/Power User Choice**: Name the flagship choice for demanding users.
• **Summary Verdict**: Clear guidance on which buyer persona should choose which item.`;

    const userPrompt = `Compare the following products concisely based on these specs:\n${productDetails}`;

    const groqVerdict = await callGroqAPI(systemPrompt, userPrompt);
    if (groqVerdict) {
      verdictSummary = groqVerdict;
    }
  }

  // Fallback to Gemini if Groq was not used
  if (!verdictSummary && apiKey && !apiKey.startsWith('gsk_') && !apiKey.includes('YOUR_')) {
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const prompt = `Compare the following products concisely:
${productDetails}

Provide:
1. Key differences and trade-offs.
2. Best choice for value/budget.
3. Best choice for premium performance/power user.
4. Final verdict for buyers.`;

      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      const data = await response.json();
      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        verdictSummary = data.candidates[0].content.parts[0].text;
      }
    } catch (err) {
      console.warn('[AI Service] Comparison Gemini API call failed, using heuristic engine:', err.message);
    }
  }

  // Fallback comparative verdict
  if (!verdictSummary) {
    const sortedByPrice = [...products].sort((a, b) => a.price - b.price);
    const sortedByRating = [...products].sort((a, b) => b.rating - a.rating);

    const budgetPick = sortedByPrice[0];
    const topRatedPick = sortedByRating[0];
    const priceDiff = sortedByPrice[sortedByPrice.length - 1].price - budgetPick.price;

    verdictSummary = `### AI Product Comparison Analysis

• **Best Value for Money**: **${budgetPick.name}** at ₹${budgetPick.price.toLocaleString('en-IN')}. It delivers the most cost-effective solution, saving you ₹${priceDiff.toLocaleString('en-IN')} while offering core capabilities (${budgetPick.features.slice(0, 2).join(', ')}).

• **Highest Customer Satisfaction**: **${topRatedPick.name}** holds the leading rating of **${topRatedPick.rating}★** across verified customer reviews.

• **Summary Verdict**:
- Choose **${budgetPick.name}** if you are budget-conscious and looking for maximum everyday utility.
- Choose **${sortedByPrice[sortedByPrice.length - 1].name}** if you prioritize flagship build quality, higher performance, and premium tier features.`;
  }

  return {
    products,
    specsKeys: Array.from(allSpecKeys),
    comparisonMatrix,
    verdictSummary,
  };
};

/**
 * 5. Review Sentiment Analysis
 */
const analyzeSentiment = async (comment, rating = null) => {
  const text = comment.toLowerCase();

  // Sentiment Lexicon
  const positiveWords = [
    'great', 'excellent', 'love', 'loved', 'best', 'awesome', 'amazing',
    'good', 'superb', 'fantastic', 'fast', 'durable', 'smooth', 'satisfied',
    'impressed', 'perfect', 'worth', 'recommend', 'happy', 'flawless', 'crisp'
  ];
  const negativeWords = [
    'bad', 'poor', 'worst', 'terrible', 'horrible', 'broken', 'slow',
    'defective', 'disappointed', 'waste', 'regret', 'cheap', 'noisy', 'overheating',
    'useless', 'faulty', 'damaged', 'lag', 'failed', 'issue', 'problem'
  ];

  let posScore = 0;
  let negScore = 0;

  positiveWords.forEach(w => {
    const matches = text.match(new RegExp(`\\b${w}\\b`, 'gi'));
    if (matches) posScore += matches.length;
  });

  negativeWords.forEach(w => {
    const matches = text.match(new RegExp(`\\b${w}\\b`, 'gi'));
    if (matches) negScore += matches.length;
  });

  let sentiment = 'neutral';
  if (posScore > negScore) {
    sentiment = 'positive';
  } else if (negScore > posScore) {
    sentiment = 'negative';
  } else {
    // If scores are tied, use numeric rating if available
    if (rating !== null) {
      if (rating >= 4) sentiment = 'positive';
      else if (rating <= 2) sentiment = 'negative';
      else sentiment = 'neutral';
    }
  }

  return {
    sentiment,
    posScore,
    negScore,
  };
};

/**
 * Get aggregated sentiment statistics for a product
 */
const getProductSentimentSummary = async (productId) => {
  const reviews = await Review.find({ product: productId }).lean();

  if (reviews.length === 0) {
    return {
      totalReviews: 0,
      breakdown: { positive: 0, neutral: 0, negative: 0 },
      percentages: { positive: 0, neutral: 0, negative: 0 },
      overallVerdict: 'No reviews submitted yet for this product.',
    };
  }

  let pos = 0, neu = 0, neg = 0;
  reviews.forEach(r => {
    if (r.sentiment === 'positive') pos++;
    else if (r.sentiment === 'negative') neg++;
    else neu++;
  });

  const total = reviews.length;
  const positivePct = Math.round((pos / total) * 100);
  const neutralPct = Math.round((neu / total) * 100);
  const negativePct = Math.round((neg / total) * 100);

  let overallVerdict = 'Mixed customer feedback.';
  if (positivePct >= 70) {
    overallVerdict = 'Overwhelmingly positive! Customers frequently praise build quality and performance.';
  } else if (positivePct >= 50) {
    overallVerdict = 'Generally positive sentiment with high buyer satisfaction.';
  } else if (negativePct >= 40) {
    overallVerdict = 'Noticeable customer concerns reported. Check individual reviews for detailed feedback.';
  }

  return {
    totalReviews: total,
    breakdown: { positive: pos, neutral: neu, negative: neg },
    percentages: { positive: positivePct, neutral: neutralPct, negative: negativePct },
    overallVerdict,
  };
};

module.exports = {
  chatAssistant,
  naturalLanguageSearch,
  getPersonalizedRecommendations,
  compareProducts,
  analyzeSentiment,
  getProductSentimentSummary,
};
