const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  getAIActivityLog,
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/auth');

// All admin routes require admin privileges
router.use(protect);
router.use(admin);

router.get('/dashboard', getDashboardStats);
router.get('/analytics', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);
router.get('/ai-activity', getAIActivityLog);

module.exports = router;
