const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Product = require('./models/Product');
const Review = require('./models/Review');
const Order = require('./models/Order');
const Cart = require('./models/Cart');
const AIActivity = require('./models/AIActivity');
const { users, products, sampleReviews } = require('./utils/seedData');

dotenv.config();

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai_ecommerce';
    console.log(`[Seed] Connecting to database: ${mongoUri}...`);

    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected successfully.');

    // Clear existing collections
    console.log('[Seed] Clearing existing collections...');
    await User.deleteMany();
    await Product.deleteMany();
    await Review.deleteMany();
    await Order.deleteMany();
    await Cart.deleteMany();
    await AIActivity.deleteMany();

    // Insert Users
    console.log('[Seed] Creating users...');
    const createdUsers = [];
    for (const u of users) {
      const created = await User.create(u);
      createdUsers.push(created);
    }
    console.log(`[Seed] Created ${createdUsers.length} users.`);

    // Insert Products
    console.log('[Seed] Creating products...');
    const createdProducts = await Product.insertMany(products);
    console.log(`[Seed] Created ${createdProducts.length} products.`);

    // Distribute sample reviews across products
    console.log('[Seed] Populating realistic customer reviews and sentiment...');
    const customerUsers = createdUsers.filter((u) => u.role === 'customer');

    let reviewCount = 0;
    for (let i = 0; i < createdProducts.length; i++) {
      const product = createdProducts[i];
      // Attach 1 to 3 reviews to each product from distinct users
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
        reviewCount++;
      }

      // Update product rating and numReviews based on seeded reviews
      const productReviews = await Review.find({ product: product._id });
      const avg =
        productReviews.reduce((acc, r) => acc + r.rating, 0) /
        productReviews.length;
      product.rating = Math.round(avg * 10) / 10;
      product.numReviews = productReviews.length;
      await product.save();
    }
    console.log(`[Seed] Created ${reviewCount} reviews with AI sentiment scores.`);

    // Populate a sample order for the customer user
    const sampleCustomer = customerUsers[0];
    const firstProduct = createdProducts[0];
    const secondProduct = createdProducts[1];

    await Order.create({
      user: sampleCustomer._id,
      orderItems: [
        {
          product: firstProduct._id,
          name: firstProduct.name,
          qty: 1,
          price: firstProduct.price,
          image: firstProduct.images[0],
        },
        {
          product: secondProduct._id,
          name: secondProduct.name,
          qty: 1,
          price: secondProduct.price,
          image: secondProduct.images[0],
        },
      ],
      shippingAddress: {
        address: '123 Tech Park, Silicon Road',
        city: 'Bengaluru',
        postalCode: '560001',
        country: 'India',
        phone: '+91 9876543210',
      },
      paymentMethod: 'UPI / QR Code',
      paymentStatus: 'Completed',
      totalAmount: firstProduct.price + secondProduct.price,
      orderStatus: 'Delivered',
    });
    console.log('[Seed] Created sample customer order.');

    // Seed initial AI Activity
    await AIActivity.create({
      user: sampleCustomer._id,
      query: 'I need a laptop for programming under ₹60000',
      type: 'chat',
      results: {
        matchedCount: 2,
        mode: 'fallback_nlp',
      },
    });
    console.log('[Seed] Created sample AI activity record.');

    console.log('\n=========================================');
    console.log(' DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('=========================================');
    console.log('Demo Credentials:');
    console.log('  Admin User    : admin@example.com  | Password: admin123');
    console.log('  Customer User : user@example.com   | Password: user123');
    console.log('=========================================\n');

    process.exit(0);
  } catch (err) {
    console.error(`[Seed Error]: ${err.message}`);
    process.exit(1);
  }
};

seedDatabase();
