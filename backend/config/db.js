const mongoose = require('mongoose');

let memoryServerInstance = null;

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  // 1. If explicit Atlas or remote URI provided, connect to it
  if (mongoUri && mongoUri.startsWith('mongodb+srv://')) {
    try {
      console.log(`[MongoDB] Connecting to MongoDB Atlas...`);
      const conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
      console.log(`[MongoDB] Connected successfully to Atlas host: ${conn.connection.host}`);
      await seedInitialDataIfEmpty();
      return;
    } catch (err) {
      console.error(`[MongoDB Atlas Error]: ${err.message}`);
      console.log(`[MongoDB] Falling back to local in-memory database...`);
    }
  }

  // 2. Try standard URI (e.g. local mongodb://127.0.0.1:27017)
  if (mongoUri && !mongoUri.startsWith('mongodb+srv://') && !mongoUri.includes('YOUR_MONGODB_ATLAS')) {
    try {
      console.log(`[MongoDB] Attempting connection to: ${mongoUri}...`);
      const conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
      console.log(`[MongoDB] Connected to database: ${conn.connection.host}`);
      await seedInitialDataIfEmpty();
      return;
    } catch (err) {
      console.warn(`[MongoDB Notice] Local MongoDB service not active (${err.message}). Starting In-Memory MongoDB...`);
    }
  }

  // 3. Persistent Local MongoDB Fallback (Guarantees accounts & orders never deleted)
  try {
    const path = require('path');
    const fs = require('fs');
    const dbPath = path.join(__dirname, '..', 'data_db');
    if (!fs.existsSync(dbPath)) {
      fs.mkdirSync(dbPath, { recursive: true });
    }

    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServerInstance = await MongoMemoryServer.create({
      binary: { arch: 'x64', version: '7.0.14' },
      instance: {
        dbPath,
        storageEngine: 'wiredTiger',
      },
    });
    const memoryUri = memoryServerInstance.getUri();
    console.log(`[MongoDB] Persistent Database launched at: ${memoryUri} (Storage: ${dbPath})`);

    const conn = await mongoose.connect(memoryUri);
    console.log(`[MongoDB] Connected to database. Checking existing records...`);
    await seedInitialDataIfEmpty();
  } catch (memErr) {
    console.error(`[MongoDB Storage Failure]: ${memErr.message}`);
  }
};

const seedInitialDataIfEmpty = async () => {
  try {
    const User = require('../models/User');
    const Product = require('../models/Product');
    const Review = require('../models/Review');
    const Order = require('../models/Order');

    // Ensure Aadil admin account exists
    const aadilAdmin = await User.findOne({ email: 'aadilmohamed375@gmail.com' });
    if (!aadilAdmin) {
      await User.create({
        name: 'Aadil Admin',
        email: 'aadilmohamed375@gmail.com',
        password: 'admin123',
        role: 'admin',
        isVerified: true,
      });
      console.log(`[MongoDB] Created master admin account: aadilmohamed375@gmail.com`);
    }

    const userCount = await User.countDocuments();
    const productCount = await Product.countDocuments();

    if (productCount === 0 || userCount <= 1) {
      const { users, products, sampleReviews } = require('../utils/seedData');

      // Create users
      const createdUsers = [];
      for (const u of users) {
        const exists = await User.findOne({ email: u.email });
        if (!exists) {
          const created = await User.create({ ...u, isVerified: true });
          createdUsers.push(created);
        } else {
          createdUsers.push(exists);
        }
      }

      // Create products if empty
      if (productCount === 0) {
        const createdProducts = await Product.insertMany(products);

        // Create reviews - each review on a product from a distinct customer
        const customerUsers = createdUsers.filter((u) => u.role === 'customer');
        for (let i = 0; i < createdProducts.length; i++) {
          const product = createdProducts[i];
          const countToAttach = Math.min(customerUsers.length, (i % customerUsers.length) + 1);
          for (let j = 0; j < countToAttach; j++) {
            const user = customerUsers[j];
            const sample = sampleReviews[(i + j) % sampleReviews.length];
            await Review.create({
              user: user._id,
              product: product._id,
              rating: sample.rating,
              comment: sample.comment,
              sentiment: sample.sentiment,
            });
          }
          const pReviews = await Review.find({ product: product._id });
          const avg = pReviews.reduce((acc, r) => acc + r.rating, 0) / pReviews.length;
          product.rating = Math.round(avg * 10) / 10;
          product.numReviews = pReviews.length;
          await product.save();
        }

        // Sample order
        if (customerUsers.length > 0) {
          await Order.create({
            user: customerUsers[0]._id,
            orderItems: [
              {
                product: createdProducts[0]._id,
                name: createdProducts[0].name,
                qty: 1,
                price: createdProducts[0].price,
                image: createdProducts[0].images[0],
              },
            ],
            shippingAddress: {
              address: '123 Tech Boulevard',
              city: 'Bengaluru',
              postalCode: '560001',
              country: 'India',
              phone: '+91 9790380815',
            },
            paymentMethod: 'UPI / Online',
            paymentStatus: 'Completed',
            totalAmount: createdProducts[0].price,
            orderStatus: 'Delivered',
          });
        }

        console.log(`[MongoDB] Initial catalog seeded: ${createdProducts.length} products with reviews.`);
      }
    }
  } catch (err) {
    console.error(`[MongoDB Seeding Notice]: ${err.message}`);
  }
};

module.exports = connectDB;
