const nodemailer = require('nodemailer');

// Keep in-memory cache of recent simulated emails for easy developer testing and UI inspection
const simulatedEmailInbox = [];

/**
 * Send an email via Brevo REST API v3 with Nodemailer and simulation fallbacks.
 * @param {Object} options - Email dispatch options
 * @param {string} options.to - Recipient email address
 * @param {string} [options.toName] - Recipient name
 * @param {string} options.subject - Email subject line
 * @param {string} options.html - HTML body
 * @param {Array<{content: string|Buffer, name: string}>} [options.attachments] - Array of attachments (Buffer or base64 string)
 * @returns {Promise<{success: boolean, messageId?: string, simulated?: boolean}>}
 */
const sendEmail = async ({ to, toName, subject, html, attachments = [] }) => {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'notifications@nexora.shop';
  const senderName = process.env.BREVO_SENDER_NAME || 'Nexora AI Store';

  // Format attachments for Brevo API (requires base64 content)
  const brevoAttachments = attachments.map((att) => {
    let base64Content = '';
    if (Buffer.isBuffer(att.content)) {
      base64Content = att.content.toString('base64');
    } else if (typeof att.content === 'string') {
      base64Content = att.content;
    }
    return {
      name: att.name,
      content: base64Content,
    };
  });

  // 1. If key is an SMTP key (starts with xsmtpsib-), use Brevo SMTP relay
  if (brevoApiKey && brevoApiKey.startsWith('xsmtpsib-')) {
    try {
      console.log(`[Brevo SMTP Relay] Dispatching email to: ${to} | Subject: "${subject}"`);
      const transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.BREVO_SMTP_LOGIN || senderEmail,
          pass: brevoApiKey.trim(),
        },
      });

      const info = await transporter.sendMail({
        from: `"${senderName}" <${senderEmail}>`,
        to: toName ? `"${toName}" <${to}>` : to,
        subject,
        html,
        attachments: attachments.map((a) => ({
          filename: a.name,
          content: a.content,
        })),
      });

      console.log(`✅ [Brevo SMTP Delivered] Message ID: ${info.messageId} to ${to}`);
      return { success: true, messageId: info.messageId };
    } catch (smtpErr) {
      console.error(`❌ [Brevo SMTP Relay Error]: ${smtpErr.message}`);
    }
  }

  // 2. If Brevo REST API Key is configured, use official Brevo v3 Transactional REST API
  if (brevoApiKey && !brevoApiKey.startsWith('xsmtpsib-') && brevoApiKey.trim() !== '') {
    try {
      console.log(`[Brevo REST API] Dispatching email to: ${to} | Subject: "${subject}"`);
      const payload = {
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [
          {
            email: to,
            name: toName || 'Customer',
          },
        ],
        subject,
        htmlContent: html,
      };

      if (brevoAttachments.length > 0) {
        payload.attachment = brevoAttachments;
      }

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey.trim(),
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Brevo API returned status ${response.status}`);
      }

      console.log(`✅ [Brevo API Delivered] Message ID: ${data.messageId} to ${to}`);
      return { success: true, messageId: data.messageId };
    } catch (err) {
      console.error(`❌ [Brevo API Error]: ${err.message}`);
    }
  }

  // 2. If SMTP configuration exists
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: `"${senderName}" <${senderEmail}>`,
        to: toName ? `"${toName}" <${to}>` : to,
        subject,
        html,
        attachments: attachments.map((a) => ({
          filename: a.name,
          content: a.content,
        })),
      });

      console.log(`✅ [SMTP Email Delivered] Message ID: ${info.messageId} to ${to}`);
      return { success: true, messageId: info.messageId };
    } catch (smtpErr) {
      console.error(`❌ [SMTP Error]: ${smtpErr.message}`);
    }
  }

  // 3. Fallback / Test Simulation Mode (Logs clearly to console so testing is 100% painless)
  console.log(`\n================== [NEXORA EMAIL DISPATCH] ==================`);
  console.log(`To: ${to} (${toName || 'User'})`);
  console.log(`Subject: ${subject}`);
  console.log(`Attachments: ${brevoAttachments.length} file(s)`);
  if (brevoAttachments.length > 0) {
    brevoAttachments.forEach((a) => console.log(` - Attached: ${a.name} (${Math.round((a.content.length * 3) / 4 / 1024)} KB)`));
  }
  console.log(`[Tip: Add BREVO_API_KEY to backend/.env to send real in-box emails]`);
  console.log(`=============================================================\n`);

  const record = {
    to,
    toName,
    subject,
    date: new Date(),
    attachmentsCount: brevoAttachments.length,
  };
  simulatedEmailInbox.unshift(record);
  if (simulatedEmailInbox.length > 30) simulatedEmailInbox.pop();

  return { success: true, simulated: true, note: 'Email simulated in terminal. Add BREVO_API_KEY to .env for live inbox dispatch.' };
};

/**
 * Send 6-digit OTP email for new account email verification.
 */
const sendRegistrationOTPEmail = async ({ email, name, otp }) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 24px; color: #f8fafc; }
        .card { max-width: 520px; margin: 0 auto; background: #1e293b; border-radius: 12px; border: 1px solid #334155; padding: 36px 30px; }
        .logo { font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
        .logo span { color: #6366f1; }
        .otp-box { background: #0f172a; border: 2px dashed #6366f1; border-radius: 10px; padding: 18px; text-align: center; margin: 24px 0; }
        .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #38bdf8; font-family: monospace; }
        .footer { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">NEXORA<span>.</span></div>
        <h2 style="margin-top: 16px; color: #ffffff;">Verify Your Email Address</h2>
        <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6;">
          Hello ${name || 'there'},<br>
          Thank you for signing up with Nexora. Use the following One-Time Password (OTP) to activate your account:
        </p>
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
          <p style="margin: 6px 0 0; color: #94a3b8; font-size: 13px;">Valid for 10 minutes</p>
        </div>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.5;">
          If you did not create an account with Nexora, you can safely ignore this email.
        </p>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Nexora AI E-Commerce. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    toName: name,
    subject: `🔐 Your Nexora Verification Code: ${otp}`,
    html,
  });
};

/**
 * Send 6-digit OTP email for Forgot Password reset.
 */
const sendPasswordResetOTPEmail = async ({ email, name, otp }) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 24px; color: #f8fafc; }
        .card { max-width: 520px; margin: 0 auto; background: #1e293b; border-radius: 12px; border: 1px solid #334155; padding: 36px 30px; }
        .logo { font-size: 24px; font-weight: 800; color: #ffffff; }
        .logo span { color: #ef4444; }
        .otp-box { background: #0f172a; border: 2px dashed #ef4444; border-radius: 10px; padding: 18px; text-align: center; margin: 24px 0; }
        .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #f87171; font-family: monospace; }
        .footer { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">NEXORA<span>.</span></div>
        <h2 style="margin-top: 16px; color: #ffffff;">Password Reset Request</h2>
        <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6;">
          Hello ${name || 'there'},<br>
          We received a request to reset your password. Use the 6-digit One-Time Password (OTP) below to proceed:
        </p>
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
          <p style="margin: 6px 0 0; color: #94a3b8; font-size: 13px;">Valid for 15 minutes</p>
        </div>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.5;">
          If you did not request a password reset, please secure your account immediately or ignore this message.
        </p>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Nexora AI E-Commerce. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    toName: name,
    subject: `🔑 Nexora Password Reset Code: ${otp}`,
    html,
  });
};

/**
 * Send order status update email (Processing with PDF invoice, Shipped, Delivered, Cancelled).
 */
const sendOrderStatusEmail = async ({ order, status, pdfBuffer = null }) => {
  let customerEmail = order.user?.email || order.shippingAddress?.email;
  let customerName = order.user?.name || order.shippingAddress?.name || 'Customer';

  if (!customerEmail && order.user) {
    try {
      const User = require('../models/User');
      const u = await User.findById(order.user._id || order.user);
      if (u) {
        customerEmail = u.email;
        customerName = u.name || customerName;
      }
    } catch (e) {
      console.error('[Email Service] Failed to lookup user for order email:', e.message);
    }
  }

  if (!customerEmail) {
    console.warn(`[Email Service] Cannot send order email: No customer email found on order ${order._id}`);
    return { success: false, reason: 'Missing customer email' };
  }

  // Auto-generate PDF invoice if missing on Delivered or Processing
  if (!pdfBuffer && (status === 'Delivered' || status === 'Processing')) {
    try {
      const { generateInvoicePDF } = require('./pdfInvoiceService');
      pdfBuffer = await generateInvoicePDF(order);
    } catch (invErr) {
      console.error('[Email Service] Auto PDF invoice generation failed:', invErr.message);
    }
  }

  const orderId = order._id.toString();
  const orderTotal = `₹${Number(order.totalAmount || 0).toLocaleString('en-IN')}`;

  let subject = '';
  let statusBadgeColor = '#6366f1';
  let statusHeadline = '';
  let statusMessage = '';

  switch (status) {
    case 'Processing':
      subject = `🎉 Order Confirmed & Tax Invoice - #${orderId.slice(-8).toUpperCase()}`;
      statusBadgeColor = '#3b82f6';
      statusHeadline = 'Your Order is Confirmed & Being Prepared!';
      statusMessage =
        'Thank you for your order! Our fulfillment team is preparing your items. A copy of your official Tax Invoice is attached as a PDF to this email.';
      break;

    case 'Shipped':
      subject = `🚚 Order Shipped - #${orderId.slice(-8).toUpperCase()}`;
      statusBadgeColor = '#8b5cf6';
      statusHeadline = 'Your Order is On the Way!';
      statusMessage = `Great news! Your package has been handed over to Nexora Express Logistics and is currently in transit to ${order.shippingAddress?.city || 'your address'}.`;
      break;

    case 'Delivered':
      subject = `✅ Order Delivered & Official Tax Invoice - #${orderId.slice(-8).toUpperCase()}`;
      statusBadgeColor = '#10b981';
      statusHeadline = 'Your Order Has Been Delivered!';
      statusMessage =
        order.paymentMethod && order.paymentMethod.toLowerCase().includes('upi')
          ? `Your order has been delivered successfully! As per your UPI payment (${order.paymentMethod}), your official Tax Invoice and Bill receipt is attached as a PDF to this email. Thank you for choosing Nexora!`
          : `Your order has been successfully delivered! Your official Tax Invoice and Bill receipt is attached as a PDF to this email. Thank you for shopping with Nexora!`;
      break;

    case 'Cancelled':
      subject = `⚠️ Order Cancelled - #${orderId.slice(-8).toUpperCase()}`;
      statusBadgeColor = '#ef4444';
      statusHeadline = 'Your Order Has Been Cancelled';
      statusMessage =
        'Your order has been cancelled. If any payment was captured, a full refund will be credited back to your original payment method within 3-5 business days.';
      break;

    default:
      subject = `📦 Order Status Update - #${orderId.slice(-8).toUpperCase()}: ${status}`;
      statusBadgeColor = '#6366f1';
      statusHeadline = `Order Status: ${status}`;
      statusMessage = `Your order status has been updated to: ${status}.`;
  }

  // Generate Item list table HTML
  const itemsHtml = (order.orderItems || [])
    .map(
      (item) => `
        <tr style="border-bottom: 1px solid #334155;">
          <td style="padding: 10px; color: #f8fafc; font-weight: 500;">${item.name}</td>
          <td style="padding: 10px; color: #94a3b8; text-align: center;">${item.qty}</td>
          <td style="padding: 10px; color: #f8fafc; text-align: right; font-weight: 600;">₹${Number(item.price * item.qty).toLocaleString('en-IN')}</td>
        </tr>
      `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 24px; color: #f8fafc; }
        .card { max-width: 580px; margin: 0 auto; background: #1e293b; border-radius: 12px; border: 1px solid #334155; padding: 32px 28px; }
        .badge { display: inline-block; padding: 6px 14px; border-radius: 20px; font-weight: 700; font-size: 13px; color: #ffffff; background: ${statusBadgeColor}; text-transform: uppercase; }
        .table-box { width: 100%; border-collapse: collapse; margin: 20px 0; background: #0f172a; border-radius: 8px; overflow: hidden; }
        .table-header { background: #243247; color: #94a3b8; font-size: 12px; text-transform: uppercase; text-align: left; }
        .footer { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <div style="font-size: 24px; font-weight: 800; color: #ffffff;">NEXORA<span style="color: #6366f1;">.</span></div>
          <div class="badge">${status}</div>
        </div>

        <h2 style="color: #ffffff; margin-top: 10px;">${statusHeadline}</h2>
        <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6;">${statusMessage}</p>

        <div style="background: #0f172a; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #334155;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="color: #94a3b8; font-size: 13px;">Order Number:</span>
            <span style="color: #f8fafc; font-weight: 600; font-size: 13px;">#${orderId.slice(-8).toUpperCase()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="color: #94a3b8; font-size: 13px;">Delivery To:</span>
            <span style="color: #f8fafc; font-size: 13px;">${order.shippingAddress?.address || ''}, ${order.shippingAddress?.city || ''}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #94a3b8; font-size: 13px;">Payment Status:</span>
            <span style="color: #10b981; font-weight: 600; font-size: 13px;">${order.paymentStatus || 'Completed'}</span>
          </div>
        </div>

        <table class="table-box">
          <thead>
            <tr class="table-header">
              <th style="padding: 10px;">Item</th>
              <th style="padding: 10px; text-align: center;">Qty</th>
              <th style="padding: 10px; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
            <tr>
              <td colspan="2" style="padding: 14px 10px; color: #f8fafc; font-weight: 700; font-size: 15px;">Total Paid:</td>
              <td style="padding: 14px 10px; color: #38bdf8; font-weight: 800; font-size: 16px; text-align: right;">${orderTotal}</td>
            </tr>
          </tbody>
        </table>

        ${
          pdfBuffer
            ? `<div style="background: #243247; border-radius: 8px; padding: 12px 16px; display: flex; align-items: center; margin-top: 16px;">
                 <span style="font-size: 20px; margin-right: 10px;">📄</span>
                 <span style="font-size: 13px; color: #cbd5e1;">Official PDF Tax Invoice attached: <strong>Invoice_${orderId.slice(-8).toUpperCase()}.pdf</strong></span>
               </div>`
            : ''
        }

        <div class="footer">
          Need assistance with your order? Reply to this email or visit your Nexora portal.<br>
          &copy; ${new Date().getFullYear()} Nexora Technologies Pvt. Ltd.
        </div>
      </div>
    </body>
    </html>
  `;

  const attachments = [];
  if (pdfBuffer) {
    attachments.push({
      name: `Invoice_${orderId.slice(-8).toUpperCase()}.pdf`,
      content: pdfBuffer,
    });
  }

  return sendEmail({
    to: customerEmail,
    toName: customerName,
    subject,
    html,
    attachments,
  });
};

module.exports = {
  sendEmail,
  sendRegistrationOTPEmail,
  sendPasswordResetOTPEmail,
  sendOrderStatusEmail,
  simulatedEmailInbox,
};
