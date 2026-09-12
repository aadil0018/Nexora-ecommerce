const express = require('express');
const router = express.Router();
const {
  registerUser,
  verifyOTP,
  resendOTP,
  forgotPassword,
  resetPassword,
  loginUser,
  getUserProfile,
  updateUserProfile,
  toggleWishlist,
  recordBrowsingHistory,
  clearBrowsingHistory,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', registerUser);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.post('/wishlist/:productId', protect, toggleWishlist);
router.post('/browsing-history/:productId', protect, recordBrowsingHistory);
router.delete('/browsing-history', protect, clearBrowsingHistory);

module.exports = router;
