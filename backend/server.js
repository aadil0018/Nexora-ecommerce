const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables from backend/.env or root .env
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);

// Dev logging middleware
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date(),
    service: 'AI-Powered E-Commerce Recommendation and Shopping Assistant API',
  });
});

// Mount Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// WhatsApp Web QR & Connection Status Endpoints
const { getWhatsAppStatus } = require('./services/whatsappService');

app.get('/api/whatsapp/status', (req, res) => {
  res.status(200).json({
    success: true,
    ...getWhatsAppStatus(),
  });
});

app.get('/api/whatsapp/scan', (req, res) => {
  const status = getWhatsAppStatus();

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nexora — WhatsApp Automated Sender Connection</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        body { background: #0b141a; color: #e9edef; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
        .card { background: #111b21; border: 1px solid #222d34; border-radius: 16px; padding: 36px 32px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 12px 40px rgba(0,0,0,0.5); }
        h1 { font-size: 1.4rem; font-weight: 700; margin-bottom: 8px; color: #fff; }
        p { color: #8696a0; font-size: 0.9rem; line-height: 1.5; margin-bottom: 24px; }
        .qr-box { background: #fff; padding: 16px; border-radius: 12px; display: inline-block; margin-bottom: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
        .qr-box img { width: 250px; height: 250px; display: block; }
        .badge-connected { background: rgba(37, 211, 102, 0.15); color: #25d366; border: 1px solid #25d366; padding: 10px 18px; border-radius: 30px; font-weight: 700; font-size: 0.95rem; display: inline-flex; align-items: center; gap: 8px; margin-bottom: 20px; }
        .badge-waiting { background: rgba(251, 191, 36, 0.15); color: #fbbf24; border: 1px solid #fbbf24; padding: 6px 14px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; display: inline-block; margin-bottom: 16px; }
        .instructions { text-align: left; background: #202c33; border-radius: 10px; padding: 18px 20px; font-size: 0.85rem; color: #d1d7db; line-height: 1.6; }
        .instructions ol { padding-left: 18px; }
        .instructions li { margin-bottom: 6px; }
        .btn-refresh { background: #25d366; color: #0b141a; font-weight: 700; border: none; padding: 10px 20px; border-radius: 8px; font-size: 0.88rem; cursor: pointer; margin-top: 20px; }
      </style>
      <script>
        // Auto-refresh every 5 seconds until connected
        setInterval(() => {
          fetch('/api/whatsapp/status')
            .then(r => r.json())
            .then(data => {
              if (data.status === 'open') {
                location.reload();
              }
            });
        }, 4000);
      </script>
    </head>
    <body>
      <div class="card">
        <h1>📱 WhatsApp Automated Sender</h1>
        <p>Link your WhatsApp to send real order receipts, tracking, and cancellation alerts directly to all customers.</p>

        ${status.status === 'open' ? `
          <div class="badge-connected">
            <span>● Connected: +${status.connectedUser || 'Active'}</span>
          </div>
          <p style="color: #25d366; font-size: 0.95rem; font-weight: 600;">
            ✅ Automated background messaging is ACTIVE!<br/>
            All customer orders will automatically receive WhatsApp receipts from this number without opening any browser tabs.
          </p>
        ` : status.qrDataUrl ? `
          <div class="badge-waiting">Scan QR code with your phone</div>
          <div class="qr-box">
            <img src="${status.qrDataUrl}" alt="WhatsApp Web QR Code" />
          </div>
          <div class="instructions">
            <strong style="color:#fff; display:block; margin-bottom: 8px;">How to link in 5 seconds:</strong>
            <ol>
              <li>Open <strong>WhatsApp</strong> on your phone</li>
              <li>Tap <strong>Settings</strong> or <strong>⋮ (Three dots)</strong> ➔ <strong>Linked Devices</strong></li>
              <li>Tap <strong>Link a Device</strong></li>
              <li>Scan the QR code shown above!</li>
            </ol>
          </div>
        ` : `
          <div class="badge-waiting">Generating fresh QR code...</div>
          <p>Please wait a few seconds or refresh the page.</p>
        `}

        <button class="btn-refresh" onclick="location.reload()">Refresh Status</button>
      </div>
    </body>
    </html>
  `);
});

// 404 handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint not found: ${req.originalUrl}`,
  });
});

// Serve frontend static build if present (Production full-stack single deploy)
const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));

app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return next();
  }
  const indexHtml = path.join(frontendDistPath, 'index.html');
  res.sendFile(indexHtml, (err) => {
    if (err) next();
  });
});

// Centralized error handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`[Server] AI-Ecommerce Backend running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`[Unhandled Rejection Error]: ${err.message}`);
});

module.exports = app;
