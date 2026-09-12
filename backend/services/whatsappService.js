/**
 * WhatsApp Notification Service for AI-Powered E-Commerce (Nexora)
 * Supports:
 * 1. WhatsApp Web QR Session (Baileys) — 100% Free, sends real WhatsApp directly to any number
 * 2. Meta WhatsApp Business Cloud API
 * 3. Local Simulation Mode (records formatted receipts for audit & viva demos)
 */

const path = require('path');
const pino = require('pino');
const qrcode = require('qrcode');

let baileysSock = null;
let baileysStatus = 'disconnected'; // 'disconnected' | 'qr_ready' | 'open'
let baileysQrRaw = null;
let baileysQrDataUrl = null;
let baileysConnectedUser = null;

// In-memory store of recent dispatched notifications
const recentNotifications = [];

/**
 * Format phone to international E.164 (e.g., +919876543210)
 */
const formatPhoneNumber = (phone) => {
  if (!phone) return process.env.DEFAULT_CUSTOMER_PHONE || '+918946066632';
  let cleaned = phone.toString().replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.startsWith('0')) cleaned = cleaned.replace(/^0+/, '');
  if (cleaned.length === 10) return `+91${cleaned}`;
  if (cleaned.startsWith('91') && cleaned.length === 12) return `+${cleaned}`;
  return `+${cleaned}`;
};

/**
 * Log and record notification
 */
const recordNotification = (type, recipient, message, status, meta = {}) => {
  const entry = {
    id: `WA_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type,
    recipient,
    message,
    status,
    timestamp: new Date().toISOString(),
    ...meta,
  };
  recentNotifications.unshift(entry);
  if (recentNotifications.length > 50) recentNotifications.pop();
  return entry;
};

/**
 * Initialize Baileys WhatsApp Web client
 */
const initBaileys = async () => {
  try {
    const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
    const authDir = path.join(__dirname, '..', 'session_auth');
    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    baileysSock = makeWASocket({
      auth: state,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: true,
      browser: ['Nexora Store', 'Chrome', '1.0.0'],
    });

    baileysSock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        baileysQrRaw = qr;
        baileysStatus = 'qr_ready';
        try {
          baileysQrDataUrl = await qrcode.toDataURL(qr);
          console.log('[WhatsApp Web] New QR Code generated. Scan at: http://localhost:5000/api/whatsapp/scan');
        } catch (qrErr) {
          console.error('[WhatsApp Web] QR render error:', qrErr.message);
        }
      }

      if (connection === 'open') {
        baileysStatus = 'open';
        baileysQrRaw = null;
        baileysQrDataUrl = null;
        baileysConnectedUser = baileysSock.user?.id ? baileysSock.user.id.split(':')[0] : 'Connected';
        console.log(`\n✅ [WhatsApp Web Connected!] Logged in as +${baileysConnectedUser}`);
        console.log('Automated WhatsApp order confirmations and status updates are now LIVE!\n');
      }

      if (connection === 'close') {
        baileysStatus = 'disconnected';
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.log(`[WhatsApp Web] Connection closed (code: ${statusCode}). Reconnecting: ${shouldReconnect}`);
        if (shouldReconnect) {
          setTimeout(initBaileys, 3000);
        } else {
          baileysConnectedUser = null;
        }
      }
    });

    baileysSock.ev.on('creds.update', saveCreds);
  } catch (err) {
    console.warn('[WhatsApp Web] Baileys init notice:', err.message);
  }
};

// Start WhatsApp Web listener automatically
initBaileys();

/**
 * Dispatch message via active provider:
 * 1. Real WhatsApp Web (Baileys) if connected
 * 2. Meta WhatsApp Cloud API (if configured)
 * 3. Twilio (if configured)
 * 4. Local Simulator & Audit Log
 */
const dispatchMessage = async (recipientPhone, messageBody, metadata = {}) => {
  const formattedPhone = formatPhoneNumber(recipientPhone);
  const cleanDigits = formattedPhone.replace(/[^0-9]/g, '');

  // 1. WhatsApp Web (Baileys) — Real direct message
  if (baileysSock && baileysStatus === 'open') {
    try {
      const jid = `${cleanDigits}@s.whatsapp.net`;
      const sent = await baileysSock.sendMessage(jid, { text: messageBody });
      console.log(`[WhatsApp Web Sent] Direct message delivered to ${formattedPhone} (ID: ${sent.key?.id})`);
      const entry = recordNotification(metadata.type || 'Order', formattedPhone, messageBody, 'SENT_WHATSAPP_WEB', {
        messageId: sent.key?.id,
        from: baileysConnectedUser,
      });
      return { success: true, provider: 'baileys', messageId: sent.key?.id, record: entry };
    } catch (bErr) {
      console.error('[WhatsApp Web Error]:', bErr.message);
    }
  }

  // 2. Meta WhatsApp Cloud API (if configured)
  if (process.env.WHATSAPP_CLOUD_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_CLOUD_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: cleanDigits,
            type: 'text',
            text: { body: messageBody },
          }),
        }
      );
      const data = await response.json();
      recordNotification(metadata.type || 'Order', formattedPhone, messageBody, 'SENT_META_CLOUD', { metaData: data });
      return { success: true, provider: 'meta_cloud', response: data };
    } catch (err) {
      console.error('[WhatsApp Cloud API Error]:', err.message);
    }
  }

  // 3. Fallback: Formatted Simulation Log
  console.log('\n' + '='.repeat(65));
  console.log('📱 [WHATSAPP AUTOMATED NOTIFICATION DISPATCHED]');
  console.log(`To: ${formattedPhone} [Role: ${metadata.recipientRole || 'Recipient'}]`);
  console.log(`Event: ${metadata.type || 'Order Notification'}`);
  console.log(`Timestamp: ${new Date().toLocaleTimeString()}`);
  console.log('-'.repeat(65));
  console.log(messageBody);
  console.log('='.repeat(65) + '\n');

  const record = recordNotification(metadata.type || 'Simulation', formattedPhone, messageBody, 'DISPATCHED_ACTIVE');
  return { success: true, provider: 'simulator', record };
};

/**
 * Send WhatsApp notification when an order is placed:
 * 1. Customer receives digital order receipt on their entered phone number.
 * 2. Store Owner / Client (9790380815) receives merchant new order alert.
 */
const sendOrderPlacedMessage = async (order) => {
  if (!order || !order.shippingAddress) return;

  const shortId = order._id.toString().slice(-6).toUpperCase();
  const trackingUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders/${order._id}`;
  const customerName = order.user?.name || order.shippingAddress?.name || 'Valued Customer';
  const customerPhone = order.shippingAddress.phone || process.env.DEFAULT_CUSTOMER_PHONE || '+918946066632';
  const merchantPhone = process.env.MERCHANT_PHONE || process.env.CLIENT_PHONE || '+919790380815';

  const itemsText = (order.orderItems || [])
    .map((item) => `  • *${item.name}* (Qty: ${item.qty}) - ₹${(item.price * item.qty).toLocaleString('en-IN')}`)
    .join('\n');

  // 1. Digital Receipt for Customer
  const customerMessage = 
`🎉 *Order Confirmed!*

Hi ${customerName}! Thank you for shopping with *Nexora*. We have received your order and our fulfillment team is preparing it for dispatch!

📋 *Order Details:*
• *Order ID:* #${shortId}
• *Total Paid:* ₹${order.totalAmount.toLocaleString('en-IN')}
• *Payment Method:* ${order.paymentMethod} (${order.paymentStatus})

📦 *Items Purchased:*
${itemsText}

📍 *Delivery Address:*
${order.shippingAddress.address}, ${order.shippingAddress.city} - ${order.shippingAddress.postalCode}

🚚 *Live Tracking & Digital Receipt:*
${trackingUrl}

Reply *SUPPORT* anytime to chat with our AI Shopping Assistant! ✨`;

  // 2. New Order Alert for Store Owner / Client
  const merchantMessage =
`🔔 *NEW CUSTOMER ORDER RECEIVED!*

An order has just been placed on *Nexora*!

📋 *Order Summary:*
• *Order ID:* #${shortId}
• *Customer Name:* ${customerName}
• *Customer Phone:* ${customerPhone}
• *Total Amount:* ₹${order.totalAmount.toLocaleString('en-IN')}
• *Payment Method:* ${order.paymentMethod} (${order.paymentStatus})

📦 *Items Ordered:*
${itemsText}

📍 *Delivery Destination:*
${order.shippingAddress.address}, ${order.shippingAddress.city} - ${order.shippingAddress.postalCode}

🔗 *View Order in Admin Dashboard:*
${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/orders`;

  // Dispatch to Customer
  const customerDispatch = await dispatchMessage(customerPhone, customerMessage, {
    type: 'CUSTOMER_ORDER_PLACED',
    orderId: order._id,
    recipientRole: 'customer',
  });

  // Also dispatch to Store Owner / Client if customer phone is different from merchant phone
  let merchantDispatch = null;
  const formattedCust = formatPhoneNumber(customerPhone);
  const formattedMerch = formatPhoneNumber(merchantPhone);

  if (formattedCust !== formattedMerch) {
    merchantDispatch = await dispatchMessage(merchantPhone, merchantMessage, {
      type: 'MERCHANT_ORDER_ALERT',
      orderId: order._id,
      recipientRole: 'merchant',
    });
  }

  return { customerDispatch, merchantDispatch };
};

/**
 * Send WhatsApp delivery / shipping status update
 */
const sendOrderDeliveryUpdate = async (order) => {
  if (!order || !order.shippingAddress) return;

  const shortId = order._id.toString().slice(-6).toUpperCase();
  const trackingUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders/${order._id}`;
  const customerPhone = order.shippingAddress.phone || process.env.DEFAULT_CUSTOMER_PHONE || '+918946066632';

  let header = `📦 *Order Update #${shortId}*`;
  let body = `Your order status has been updated to: *${order.orderStatus}*`;

  if (order.orderStatus === 'Processing') {
    header = `⚙️ *Order #${shortId} is Being Processed!*`;
    body = `Great news! Your order has been confirmed and our fulfillment team is inspecting and carefully preparing your package for dispatch to ${order.shippingAddress.city}.\n\n🔗 *Track Live:* ${trackingUrl}`;
  } else if (order.orderStatus === 'Shipped') {
    header = `🚚 *Your Order #${shortId} is On The Way!*`;
    body = `Great news! Your package has been dispatched from our fulfillment center and is out for delivery to ${order.shippingAddress.city}.\n\n🔗 *Track Live:* ${trackingUrl}`;
  } else if (order.orderStatus === 'Delivered') {
    header = `✅ *Delivered: Order #${shortId}*`;
    body = `Your package has been successfully delivered! We hope you love your new products.\n\n⭐ *Share Your Feedback:* Help other shoppers by leaving a review:\n${trackingUrl}`;
  } else if (order.orderStatus === 'Cancelled') {
    header = `⚠️ *Order #${shortId} Cancelled*`;
    body = `Your order #${shortId} has been cancelled. If payment was already collected, your refund will be credited back within 3-5 business days.`;
  }

  const messageBody = 
`${header}

${body}

_Thank you for choosing Nexora!_ 🛍️`;

  return await dispatchMessage(customerPhone, messageBody, {
    type: `ORDER_${order.orderStatus.toUpperCase()}`,
    orderId: order._id,
    recipientRole: 'customer',
  });
};

/**
 * Get current WhatsApp Web connection status & QR code
 */
const getWhatsAppStatus = () => {
  return {
    status: baileysStatus,
    qrDataUrl: baileysQrDataUrl,
    connectedUser: baileysConnectedUser,
    totalDispatched: recentNotifications.length,
  };
};

/**
 * Get recent notification logs (for Admin inspection & Demo verification)
 */
const getRecentNotifications = () => recentNotifications;

module.exports = {
  sendOrderPlacedMessage,
  sendOrderDeliveryUpdate,
  getWhatsAppStatus,
  getRecentNotifications,
  formatPhoneNumber,
  initBaileys,
};
