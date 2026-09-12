# AI-Powered Personalized E-Commerce Recommendation and Shopping Assistant (MERN Stack)

A production-style, full-stack AI-native e-commerce platform built with the MERN stack (MongoDB Atlas, Express.js, React.js, Node.js). It solves customer choice overload by integrating:
1. **AI Shopping Assistant (Conversational Copilot)**: Dialog-based product recommendation grounded in actual database catalog inventory.
2. **Natural Language Product Search**: Plain English search parsing ("wireless headphones under ₹5000 with good battery life") into structured query filters.
3. **Personalized Recommendations**: User interest tracking based on browsing history, wishlist, previous purchases, and ratings.
4. **Product Comparison Matrix**: Side-by-side comparison of 2–3 products with an AI trade-off and verdict summary.
5. **Review Sentiment Analysis**: Automated sentiment classification (Positive, Neutral, Negative) and satisfaction scoring for every product.

---

## 🚀 Key Features

### 🛒 Customer Features
- **Authentication**: JWT token authentication, secure password hashing with bcrypt, session persistence.
- **Product Catalog**: Live search, category filtering (Laptops, Smartphones, Audio, Wearables, Accessories), brand filter, price range slider (in ₹ INR), rating filter, stock filter, sorting.
- **Product Details**: Multi-image thumbnail gallery, price with discount calculations, key features, technical specifications sheet.
- **AI Sentiment Meter**: Positive/Neutral/Negative percentage breakdown and AI verdict on customer feedback.
- **Cart & Wishlist**: Real-time quantity adjustments, stock deduction validation, save for later.
- **Checkout & Orders**: Multi-step checkout (Cash on Delivery, UPI, Cards), order timeline tracking (*Processing ➔ Shipped ➔ Delivered*), printable invoice.
- **Personalized Profile**: User preferences and recent browsing history rail with one-click clear option.

### 🛡️ Admin Portal
- **Analytics Dashboard**: Real-time KPIs for Total Sales (₹), Total Orders, Catalog Products, Active Users, Pending vs Delivered breakdown.
- **Hardware Inventory Management**: Add, edit, and delete products with a dynamic specifications sheet builder.
- **Order Dispatch Pipeline**: Change order fulfillment status with instant updates.
- **User Directory**: View registered customers and toggle administrative privileges.
- **Review Moderation**: Moderate reviews and inspect automated sentiment classifications.
- **AI Telemetry Logs**: Audit stream of all user queries, searches, and recommendation telemetry.

---

## 🧠 Dual-Engine AI Architecture

The backend AI service (`services/aiService.js`) implements a dual-engine pattern:
- **Primary Mode (Google Gemini API)**: Enabled when `AI_API_KEY` is provided in `backend/.env`. Communicates securely through backend REST endpoints—the key is never exposed to the client.
- **Fallback / Mock Mode (Grounded NLP Engine)**: If no API key is provided or if network limits occur, an internal NLP regex and heuristic engine takes over. It extracts categories, budgets (e.g. "under 60000"), brands, and features, and queries the real MongoDB collections. Responses are 100% realistic, grounded in the database, and never hallucinate non-existent items.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, React Router v6, Axios, Lucide React, Modern Vanilla CSS Design System |
| **Backend** | Node.js, Express.js, JWT, bcryptjs, CORS, dotenv, Morgan |
| **Database** | MongoDB Atlas / Mongoose ORM |
| **AI Integration** | **Groq API** (High-Speed LLM Inference) + Google Gemini API + Grounded NLP Fallback Engine |

---

## 📋 Required Software

- **Node.js**: v18.0.0 or later (Node v20+ recommended)
- **npm**: v9.0.0 or later
- **MongoDB Atlas** (Free Tier account) or local MongoDB instance

---

## ⚙️ MongoDB Atlas Setup Guide

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign in or create a free account.
2. Create a free shared cluster (M0 sandbox).
3. Under **Database Access**, create a database user (e.g., username: `ecommerce_admin`, password: `<your_password>`).
4. Under **Network Access**, click **Add IP Address** and select **Allow Access from Anywhere** (`0.0.0.0/0`) for development.
5. In the Clusters view, click **Connect** ➔ **Connect your application** ➔ **Drivers** (Node.js).
6. Copy the connection string:
   ```env
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/ai_ecommerce?retryWrites=true&w=majority
   ```
7. Paste this connection string into `backend/.env` as `MONGO_URI`.

---

## 🔑 Environment Variables Configuration

In `ai-ecommerce/backend/.env`:

```env
PORT=5000
# Replace with your MongoDB Atlas connection string
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/ai_ecommerce?retryWrites=true&w=majority
JWT_SECRET=production_ai_ecommerce_jwt_secret_token_987654321

# Optional: Google Gemini API Key. If empty, the system automatically uses the built-in Grounded NLP engine.
AI_API_KEY=
```

---

## 📦 Installation & Setup

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd ../frontend
npm install
```

---

### 2. Seed Database with Realistic Hardware Catalog

Run the seeder script to populate MongoDB with electronics (MacBook Pro, Dell XPS, iPhone 15, Galaxy S24, Sony WH-1000XM5, AirPods Pro, Keychron keyboards), customer reviews, sample orders, and demo accounts:

```bash
cd backend
npm run seed
```

---

### 3. Start the Development Servers

**Start Backend Server (Port 5000):**
```bash
cd backend
npm run dev
```

**Start Frontend Server (Port 3000):**
```bash
cd frontend
npm run dev
```

Open your browser at: **`http://localhost:3000`**

---

## 🔐 Default Demo Accounts (Viva / Evaluation Testing)

The login screen features **one-click quick-fill buttons** to test both customer and admin personas without typing:

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Admin** | `admin@example.com` | `admin123` | Full Admin Dashboard, Inventory CRUD, Orders, User directory, Reviews |
| **Customer** | `user@example.com` | `user123` | Shopping, AI Assistant, Cart, Checkout, Order Tracking, Reviews |

---

## 📡 Backend REST API Overview

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Create new customer account
- `POST /api/auth/login` - Authenticate user & receive JWT token
- `GET /api/auth/profile` - Fetch profile, wishlist, and browsing history *(Protected)*
- `PUT /api/auth/profile` - Update user credentials *(Protected)*
- `POST /api/auth/wishlist/:productId` - Toggle product in wishlist *(Protected)*
- `POST /api/auth/browsing-history/:productId` - Record product view *(Protected)*
- `DELETE /api/auth/browsing-history` - Clear browsing history *(Protected)*

### Products (`/api/products`)
- `GET /api/products` - Filtered, sorted, paginated catalog search
- `GET /api/products/categories` - Distinct categories and item counts
- `GET /api/products/:id` - Detailed product specs and reviews
- `POST /api/products` - Create product *(Admin Only)*
- `PUT /api/products/:id` - Update product *(Admin Only)*
- `DELETE /api/products/:id` - Delete product *(Admin Only)*

### Shopping Cart (`/api/cart`)
- `GET /api/cart` - Retrieve current user's cart *(Protected)*
- `POST /api/cart` - Add product or increment quantity *(Protected)*
- `PUT /api/cart/:itemId` - Update item quantity *(Protected)*
- `DELETE /api/cart/:itemId` - Remove item *(Protected)*
- `DELETE /api/cart` - Clear entire cart *(Protected)*

### Orders (`/api/orders`)
- `POST /api/orders` - Place order & validate stock *(Protected)*
- `GET /api/orders/my-orders` - Customer's order history *(Protected)*
- `GET /api/orders/:id` - Single order receipt *(Protected)*
- `GET /api/orders` - View all orders with status filter *(Admin Only)*
- `PUT /api/orders/:id/status` - Update fulfillment status *(Admin Only)*

### Reviews & Sentiment (`/api/reviews`)
- `POST /api/reviews` - Submit review with automated AI sentiment analysis *(Protected)*
- `GET /api/reviews/product/:productId` - Get reviews and AI sentiment summary
- `GET /api/reviews` - All reviews for moderation *(Admin Only)*
- `DELETE /api/reviews/:id` - Delete review *(Admin Only)*

### AI Services (`/api/ai`)
- `POST /api/ai/chat` - AI Shopping Assistant chat grounded in database products
- `POST /api/ai/search` - Natural language query parsing into structured catalog filters
- `POST /api/ai/recommend` - Personalized product recommendations based on user activity
- `POST /api/ai/compare` - Compare 2–3 products with AI-generated trade-off verdict
- `POST /api/ai/sentiment` - Analyze sentiment of feedback text or product reviews

### Admin Operations (`/api/admin`)
- `GET /api/admin/dashboard` - Financial metrics, order pipeline, and telemetry
- `GET /api/admin/users` - Directory of registered users
- `PUT /api/admin/users/:id/role` - Promote or demote user roles
- `GET /api/admin/ai-activity` - Detailed audit log of AI queries

---

## 🎓 Final Year CSE Project Viva Questions & Answers

1. **How is the AI grounded in the real database?**
   The AI service never generates fake inventory. The backend extracts criteria (category, budget limits, features) from the prompt, executes targeted MongoDB queries, and feeds the matched items to the generation prompt so recommendations are strictly limited to existing stock.

2. **How does the system handle AI API downtime?**
   If the external LLM key is absent or hits rate limits, the built-in heuristic NLP engine activates without throwing an error, parsing queries and scoring sentiment via an optimized lexicon.

3. **How does personalized recommendation work?**
   The platform tracks user interaction vectors (viewed product categories, wishlist entries, past orders). If sufficient history is present, it recommends top-rated items within those categories that the user hasn't yet purchased. Otherwise, it falls back to global trending devices.
