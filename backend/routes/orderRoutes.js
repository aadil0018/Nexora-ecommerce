const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  reorderOrder,
  getWhatsAppLogs,
  downloadOrderInvoice,
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/auth');

router.use(protect); // All order routes require authentication

router.post('/', createOrder);
router.get('/my-orders', getMyOrders);
router.get('/whatsapp/logs', getWhatsAppLogs);
router.put('/:id/cancel', cancelOrder);
router.post('/:id/reorder', reorderOrder);
router.get('/:id/invoice', downloadOrderInvoice);
router.get('/:id', getOrderById);

// Admin routes
router.get('/', admin, getAllOrders);
router.put('/:id/status', admin, updateOrderStatus);

module.exports = router;
