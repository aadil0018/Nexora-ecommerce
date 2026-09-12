const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const {
  sendOrderPlacedMessage,
  sendOrderDeliveryUpdate,
  getRecentNotifications,
} = require('../services/whatsappService');
const { sendOrderStatusEmail } = require('../services/emailService');
const { generateInvoicePDF } = require('../services/pdfInvoiceService');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res, next) => {
  try {
    const { orderItems, shippingAddress, paymentMethod } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No order items specified',
      });
    }

    if (!shippingAddress || !shippingAddress.address || !shippingAddress.city) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full shipping address details (address and city)',
      });
    }

    // Default phone fallback to client number if customer left it empty
    const resolvedPhone = (shippingAddress.phone && shippingAddress.phone.trim())
      ? shippingAddress.phone.trim()
      : (process.env.DEFAULT_CUSTOMER_PHONE || '9790380815');

    // Verify stock & calculate verified total amount
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product ${item.name || item.product} not found`,
        });
      }

      if (product.stock < item.qty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}`,
        });
      }

      const itemEffectivePrice = product.discount > 0
        ? Math.round(product.price * (1 - product.discount / 100))
        : product.price;

      totalAmount += itemEffectivePrice * item.qty;

      // Decrement stock
      product.stock -= item.qty;
      await product.save();

      validatedItems.push({
        product: product._id,
        name: product.name,
        qty: item.qty,
        price: itemEffectivePrice,
        image: product.images && product.images.length > 0 ? product.images[0] : '',
      });
    }

    const order = await Order.create({
      user: req.user._id,
      orderItems: validatedItems,
      shippingAddress: {
        ...shippingAddress,
        name: shippingAddress?.name || req.user.name || 'Valued Customer',
        email: shippingAddress?.email || req.user.email,
        phone: resolvedPhone,
      },
      paymentMethod: paymentMethod || 'Cash on Delivery',
      paymentStatus: paymentMethod === 'Cash on Delivery' ? 'Pending' : 'Completed',
      totalAmount,
      orderStatus: 'Processing',
    });

    // Clear user's cart
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { items: [], totalAmount: 0 }
    );

    // Populate user info for personalized WhatsApp & Email confirmation
    const populatedOrder = await Order.findById(order._id).populate('user', 'name email');
    const orderForDispatch = populatedOrder || order;

    // 1. Trigger WhatsApp Order Confirmation (Async, non-blocking)
    sendOrderPlacedMessage(orderForDispatch).catch((err) =>
      console.error('[WhatsApp Trigger Failed]:', err.message)
    );

    // 2. Generate Official PDF Invoice & Dispatch to User Email via Brevo
    generateInvoicePDF(orderForDispatch)
      .then((pdfBuffer) => {
        sendOrderStatusEmail({
          order: orderForDispatch,
          status: 'Processing',
          pdfBuffer,
        }).catch((err) => console.error('[Brevo Order Confirmation Email Failed]:', err.message));
      })
      .catch((err) => console.error('[PDF Invoice Generation Failed]:', err.message));

    res.status(201).json({
      success: true,
      message: 'Order placed successfully. WhatsApp & Email confirmation dispatched.',
      order,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get logged in user's orders
// @route   GET /api/orders/my-orders
// @access  Private
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check authorization: must be order owner or admin
    if (
      order.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order',
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getAllOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status && status !== 'All') {
      query.orderStatus = status;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      orders,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus, paymentStatus } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (orderStatus) {
      order.orderStatus = orderStatus;
      if (orderStatus === 'Delivered') {
        order.paymentStatus = 'Completed';
      }
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    const updatedOrder = await order.save();
    const populatedOrder = await Order.findById(updatedOrder._id).populate('user', 'name email');
    const orderForDispatch = populatedOrder || updatedOrder;

    // Trigger WhatsApp Delivery / Status Update (Async, non-blocking)
    sendOrderDeliveryUpdate(orderForDispatch).catch((err) =>
      console.error('[WhatsApp Status Update Failed]:', err.message)
    );

    // Trigger Brevo Email Status Update & PDF Tax Invoice
    // On 'Delivered' (especially for UPI orders), official tax invoice PDF must be attached and sent to email
    const shouldAttachInvoice =
      orderStatus === 'Processing' ||
      orderStatus === 'Delivered' ||
      (orderForDispatch.paymentMethod && orderForDispatch.paymentMethod.includes('UPI'));

    (async () => {
      try {
        let pdfBuffer = null;
        if (shouldAttachInvoice) {
          pdfBuffer = await generateInvoicePDF(orderForDispatch);
          console.log(`[Invoice Dispatch] Generated PDF Invoice (${pdfBuffer.length} bytes) for order #${orderForDispatch._id} on status ${orderStatus}`);
        }
        await sendOrderStatusEmail({
          order: orderForDispatch,
          status: orderStatus || updatedOrder.orderStatus,
          pdfBuffer,
        });
        console.log(`[Email Service] Delivered status email with PDF invoice dispatched to ${orderForDispatch.user?.email || orderForDispatch.shippingAddress?.email}`);
      } catch (err) {
        console.error('[Brevo Status Update / Invoice Email Failed]:', err.message);
      }
    })();

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully and customer notified with email invoice',
      order: updatedOrder,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Cancel order (by customer or admin)
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check authorization: must be order owner or admin
    if (
      order.user.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order',
      });
    }

    if (order.orderStatus === 'Delivered') {
      return res.status(400).json({
        success: false,
        message: 'Delivered orders cannot be cancelled',
      });
    }

    if (order.orderStatus === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Order is already cancelled',
      });
    }

    // Mark as Cancelled
    order.orderStatus = 'Cancelled';
    const updatedOrder = await order.save();
    const populatedOrder = await Order.findById(updatedOrder._id).populate('user', 'name email');
    const orderForDispatch = populatedOrder || updatedOrder;

    // Restore stock to inventory
    for (const item of order.orderItems) {
      if (item.product) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.qty },
        });
      }
    }

    // Automatically send WhatsApp cancellation update to customer
    sendOrderDeliveryUpdate(orderForDispatch).catch((err) =>
      console.error('[WhatsApp Cancellation Notification Failed]:', err.message)
    );

    // Automatically send Brevo Cancellation Email
    sendOrderStatusEmail({
      order: orderForDispatch,
      status: 'Cancelled',
    }).catch((err) => console.error('[Brevo Cancellation Email Failed]:', err.message));

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully and stock restored to store inventory',
      order: updatedOrder,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Download Official PDF Tax Invoice
// @route   GET /api/orders/:id/invoice
// @access  Private
const downloadOrderInvoice = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Must be order owner or admin
    if (
      order.user &&
      order.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to download this invoice',
      });
    }

    const pdfBuffer = await generateInvoicePDF(order);
    const invoiceFilename = `Invoice_${order._id.toString().slice(-8).toUpperCase()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoiceFilename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
};

// @desc    Reorder: Add all items from this order back to active cart
// @route   POST /api/orders/:id/reorder
// @access  Private
const reorderOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [], totalAmount: 0 });
    }

    let addedCount = 0;
    for (const item of order.orderItems) {
      const product = await Product.findById(item.product);
      if (product && product.stock > 0) {
        const itemEffectivePrice = product.discount > 0
          ? Math.round(product.price * (1 - product.discount / 100))
          : product.price;

        const existingIndex = cart.items.findIndex(
          (ci) => ci.product.toString() === item.product.toString()
        );

        if (existingIndex > -1) {
          cart.items[existingIndex].qty += item.qty;
        } else {
          cart.items.push({
            product: item.product,
            qty: item.qty,
            price: itemEffectivePrice,
          });
        }
        addedCount++;
      }
    }

    cart.calculateTotal();
    await cart.save();

    res.status(200).json({
      success: true,
      message: `${addedCount} items added back to your cart`,
      cart,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get recent WhatsApp notification logs
// @route   GET /api/orders/whatsapp/logs
// @access  Private
const getWhatsAppLogs = async (req, res) => {
  const logs = getRecentNotifications();
  res.status(200).json({
    success: true,
    count: logs.length,
    logs,
  });
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  reorderOrder,
  getWhatsAppLogs,
  downloadOrderInvoice,
};
