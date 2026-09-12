const express = require('express');
const router = express.Router();
const {
  chat,
  searchNL,
  getRecommendations,
  compare,
  analyzeSentimentEndpoint,
} = require('../controllers/aiController');
const { optionalAuth } = require('../middleware/auth');

// Optional auth so user ID is captured when logged in for personalization
router.post('/chat', optionalAuth, chat);
router.post('/search', optionalAuth, searchNL);
router.post('/recommend', optionalAuth, getRecommendations);
router.post('/compare', optionalAuth, compare);
router.post('/sentiment', optionalAuth, analyzeSentimentEndpoint);

module.exports = router;
