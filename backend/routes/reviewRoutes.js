const express = require('express');
const router = express.Router();
const {
  createReview,
  getProductReviews,
  deleteReview,
  getAllReviewsAdmin,
} = require('../controllers/reviewController');
const { protect, admin } = require('../middleware/auth');

router.get('/product/:productId', getProductReviews);
router.post('/', protect, createReview);

// Admin routes
router.get('/', protect, admin, getAllReviewsAdmin);
router.delete('/:id', protect, admin, deleteReview);

module.exports = router;
