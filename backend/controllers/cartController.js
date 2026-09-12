const Cart = require('../models/Cart');
const Product = require('../models/Product');

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate({
      path: 'items.product',
      select: 'name price discount images stock brand category',
    });

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [], totalAmount: 0 });
    }

    res.status(200).json({
      success: true,
      cart,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add item to cart or increment quantity
// @route   POST /api/cart
// @access  Private
const addToCart = async (req, res, next) => {
  try {
    const { productId, qty = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.stock < qty) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} units available in stock`,
      });
    }

    // Effective price after discount
    const effectivePrice = product.discount > 0
      ? Math.round(product.price * (1 - product.discount / 100))
      : product.price;

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = new Cart({
        user: req.user._id,
        items: [{ product: productId, qty: Number(qty), price: effectivePrice }],
      });
    } else {
      const itemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId
      );

      if (itemIndex > -1) {
        // Item already in cart, increment quantity
        const newQty = cart.items[itemIndex].qty + Number(qty);
        if (newQty > product.stock) {
          return res.status(400).json({
            success: false,
            message: `Cannot add more than available stock (${product.stock})`,
          });
        }
        cart.items[itemIndex].qty = newQty;
        cart.items[itemIndex].price = effectivePrice;
      } else {
        // New item in cart
        cart.items.push({
          product: productId,
          qty: Number(qty),
          price: effectivePrice,
        });
      }
    }

    cart.calculateTotal();
    await cart.save();

    await cart.populate({
      path: 'items.product',
      select: 'name price discount images stock brand category',
    });

    res.status(200).json({
      success: true,
      message: 'Item added to cart',
      cart,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:itemId
// @access  Private
const updateCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { qty } = req.body;

    if (!qty || qty < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1',
      });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not in cart' });
    }

    // Verify stock
    const product = await Product.findById(item.product);
    if (product && product.stock < qty) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} units available in stock`,
      });
    }

    item.qty = Number(qty);
    cart.calculateTotal();
    await cart.save();

    await cart.populate({
      path: 'items.product',
      select: 'name price discount images stock brand category',
    });

    res.status(200).json({
      success: true,
      message: 'Cart updated',
      cart,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:itemId
// @access  Private
const removeFromCart = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.items = cart.items.filter((item) => item._id.toString() !== itemId);
    cart.calculateTotal();
    await cart.save();

    await cart.populate({
      path: 'items.product',
      select: 'name price discount images stock brand category',
    });

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      cart,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Clear entire cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      cart.totalAmount = 0;
      await cart.save();
    }

    res.status(200).json({
      success: true,
      message: 'Cart cleared',
      cart: { items: [], totalAmount: 0 },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
