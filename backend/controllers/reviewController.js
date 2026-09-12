const Review = require('../models/Review');
const Product = require('../models/Product');
const { analyzeSentiment, getProductSentimentSummary } = require('../services/aiService');

// @desc    Create or update product review with AI sentiment analysis
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res, next) => {
  try {
    const { productId, rating, comment } = req.body;

    if (!productId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Please provide productId, rating, and comment',
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Run AI Sentiment Analysis
    const sentimentResult = await analyzeSentiment(comment, Number(rating));

    // Check if user already reviewed this product
    let review = await Review.findOne({ user: req.user._id, product: productId });

    if (review) {
      // Update existing review
      review.rating = Number(rating);
      review.comment = comment;
      review.sentiment = sentimentResult.sentiment;
      await review.save();
    } else {
      // Create new review
      review = await Review.create({
        user: req.user._id,
        product: productId,
        rating: Number(rating),
        comment,
        sentiment: sentimentResult.sentiment,
      });
    }

    // Recalculate average rating & review count for product
    const allReviews = await Review.find({ product: productId });
    const avgRating =
      allReviews.reduce((acc, item) => item.rating + acc, 0) / allReviews.length;

    product.rating = Math.round(avgRating * 10) / 10;
    product.numReviews = allReviews.length;
    await product.save();

    await review.populate('user', 'name');

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully with AI sentiment analysis',
      review,
      productRating: product.rating,
      numReviews: product.numReviews,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get reviews and AI sentiment summary for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.find({ product: productId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    const sentimentSummary = await getProductSentimentSummary(productId);

    res.status(200).json({
      success: true,
      count: reviews.length,
      sentimentSummary,
      reviews,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private/Admin
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    const productId = review.product;
    await Review.findByIdAndDelete(req.params.id);

    // Recalculate rating
    const remainingReviews = await Review.find({ product: productId });
    const product = await Product.findById(productId);

    if (product) {
      if (remainingReviews.length > 0) {
        const avgRating =
          remainingReviews.reduce((acc, item) => item.rating + acc, 0) /
          remainingReviews.length;
        product.rating = Math.round(avgRating * 10) / 10;
        product.numReviews = remainingReviews.length;
      } else {
        product.rating = 0;
        product.numReviews = 0;
      }
      await product.save();
    }

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all reviews for admin moderation
// @route   GET /api/reviews
// @access  Private/Admin
const getAllReviewsAdmin = async (req, res, next) => {
  try {
    const { sentiment, page = 1, limit = 20 } = req.query;
    const query = {};

    if (sentiment && sentiment !== 'All') {
      query.sentiment = sentiment;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const total = await Review.countDocuments(query);
    const reviews = await Review.find(query)
      .populate('user', 'name email')
      .populate('product', 'name category brand images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      reviews,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createReview,
  getProductReviews,
  deleteReview,
  getAllReviewsAdmin,
};
