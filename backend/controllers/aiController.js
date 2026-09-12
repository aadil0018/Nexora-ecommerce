const AIActivity = require('../models/AIActivity');
const {
  chatAssistant,
  naturalLanguageSearch,
  getPersonalizedRecommendations,
  compareProducts,
  analyzeSentiment,
  getProductSentimentSummary,
} = require('../services/aiService');

// @desc    AI Shopping Assistant conversational endpoint
// @route   POST /api/ai/chat
// @access  Public (tracks user if logged in)
const chat = async (req, res, next) => {
  try {
    const { message, history } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a message for the shopping assistant',
      });
    }

    const userId = req.user ? req.user._id : null;
    const result = await chatAssistant(message, history || [], userId);

    // Record AI interaction activity
    try {
      await AIActivity.create({
        user: userId,
        query: message,
        type: 'chat',
        results: {
          matchedCount: result.matchedProducts.length,
          mode: result.mode,
        },
      });
    } catch (logErr) {
      console.error('[AI Activity Log Error]:', logErr.message);
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Natural Language Product Search
// @route   POST /api/ai/search
// @access  Public
const searchNL = async (req, res, next) => {
  try {
    const { query } = req.body;

    if (!query || query.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a search query',
      });
    }

    const userId = req.user ? req.user._id : null;
    const result = await naturalLanguageSearch(query);

    try {
      await AIActivity.create({
        user: userId,
        query,
        type: 'search',
        results: {
          filters: result.structuredFilters,
          count: result.count,
        },
      });
    } catch (logErr) {
      console.error('[AI Activity Log Error]:', logErr.message);
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Personalized Product Recommendations
// @route   POST /api/ai/recommend
// @access  Public (Optional auth for personalization)
const getRecommendations = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id : null;
    const result = await getPersonalizedRecommendations(userId);

    try {
      await AIActivity.create({
        user: userId,
        query: 'Personalized recommendation request',
        type: 'recommendation',
        results: {
          basis: result.recommendationBasis,
          count: result.products.length,
        },
      });
    } catch (logErr) {
      console.error('[AI Activity Log Error]:', logErr.message);
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Compare 2-3 products with AI-generated summary
// @route   POST /api/ai/compare
// @access  Public
const compare = async (req, res, next) => {
  try {
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of 2 to 3 product IDs to compare',
      });
    }

    const userId = req.user ? req.user._id : null;
    const result = await compareProducts(productIds);

    try {
      await AIActivity.create({
        user: userId,
        query: `Compare products: ${productIds.join(', ')}`,
        type: 'comparison',
        results: {
          productCount: result.products.length,
        },
      });
    } catch (logErr) {
      console.error('[AI Activity Log Error]:', logErr.message);
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Analyze sentiment of text or get product sentiment summary
// @route   POST /api/ai/sentiment
// @access  Public
const analyzeSentimentEndpoint = async (req, res, next) => {
  try {
    const { text, productId, rating } = req.body;

    if (productId) {
      const summary = await getProductSentimentSummary(productId);
      return res.status(200).json({ success: true, data: summary });
    }

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Please provide text or productId for sentiment analysis',
      });
    }

    const result = await analyzeSentiment(text, rating ? Number(rating) : null);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  chat,
  searchNL,
  getRecommendations,
  compare,
  analyzeSentimentEndpoint,
};
