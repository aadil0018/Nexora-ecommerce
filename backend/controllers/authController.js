const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
  sendRegistrationOTPEmail,
  sendPasswordResetOTPEmail,
} = require('../services/emailService');

// Helper to generate JWT token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production_12345',
    { expiresIn: '30d' }
  );
};

// @desc    Register a new user (with Brevo Email OTP verification)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    let user = await User.findOne({ email: normalizedEmail });
    if (user && user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please log in.',
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (user && !user.isVerified) {
      // User previously registered but hadn't verified OTP; update info and resend
      user.name = name;
      user.password = password;
      user.emailOTP = otp;
      user.emailOTPExpire = otpExpire;
      await user.save();
    } else {
      // Create new unverified user
      user = await User.create({
        name,
        email: normalizedEmail,
        password,
        role: role === 'admin' ? 'admin' : 'customer',
        isVerified: false,
        emailOTP: otp,
        emailOTPExpire: otpExpire,
      });
    }

    // Send OTP via Brevo Email
    await sendRegistrationOTPEmail({
      email: normalizedEmail,
      name,
      otp,
    });

    res.status(201).json({
      success: true,
      requiresVerification: true,
      message: `A 6-digit verification code has been sent to ${normalizedEmail}`,
      email: normalizedEmail,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Verify Registration OTP and activate account
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP verification code are required',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No registration found for this email address',
      });
    }

    if (user.isVerified) {
      const token = generateToken(user._id);
      return res.status(200).json({
        success: true,
        message: 'Account is already verified. Logging in...',
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          wishlist: user.wishlist,
        },
      });
    }

    if (!user.emailOTP || user.emailOTP.trim() !== otp.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code. Please check your email and try again.',
      });
    }

    if (user.emailOTPExpire && new Date(user.emailOTPExpire) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new code.',
      });
    }

    // Mark as verified & clear OTP
    user.isVerified = true;
    user.emailOTP = null;
    user.emailOTPExpire = null;
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Email successfully verified! Welcome to Nexora.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        wishlist: user.wishlist,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Resend Registration OTP
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailOTP = otp;
    user.emailOTPExpire = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendRegistrationOTPEmail({
      email: normalizedEmail,
      name: user.name,
      otp,
    });

    res.status(200).json({
      success: true,
      message: `A fresh 6-digit code has been sent to ${normalizedEmail}`,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Forgot Password - Request 6-digit OTP
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your email address' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account registered with this email address',
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpire = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    await user.save();

    await sendPasswordResetOTPEmail({
      email: normalizedEmail,
      name: user.name,
      otp,
    });

    res.status(200).json({
      success: true,
      message: `Password reset code sent to ${normalizedEmail}`,
      email: normalizedEmail,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Reset Password using 6-digit OTP
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, reset OTP, and new password',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    if (!user.resetPasswordOTP || user.resetPasswordOTP.trim() !== otp.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid password reset OTP',
      });
    }

    if (user.resetPasswordOTPExpire && new Date(user.resetPasswordOTPExpire) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Password reset code has expired. Please request a new one.',
      });
    }

    // Update password (pre-save hook hashes with bcrypt)
    user.password = newPassword;
    user.resetPasswordOTP = null;
    user.resetPasswordOTPExpire = null;
    user.isVerified = true;
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Password reset successful! You are now logged in.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        wishlist: user.wishlist,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password',
      });
    }

    const identifier = (email || req.body.username || '').trim();

    // Find user by email, name (username), or role if logging in as admin
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { name: { $regex: new RegExp(`^${identifier}$`, 'i') } },
        ...(identifier.toLowerCase() === 'admin' ? [{ role: 'admin' }] : []),
      ],
    }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if account is verified
    if (user.isVerified === false) {
      // Send fresh OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.emailOTP = otp;
      user.emailOTPExpire = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      await sendRegistrationOTPEmail({
        email: user.email,
        name: user.name,
        otp,
      });

      return res.status(403).json({
        success: false,
        requiresVerification: true,
        message: 'Please verify your email address to log in. A new verification OTP has been sent.',
        email: user.email,
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        wishlist: user.wishlist,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('wishlist')
      .populate({
        path: 'browsingHistory.product',
        select: 'name price discount images category brand rating',
      });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.name = req.body.name || user.name;
    if (req.body.email) {
      user.email = req.body.email;
    }
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();
    const token = generateToken(updatedUser._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        wishlist: updatedUser.wishlist,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle product in wishlist
// @route   POST /api/auth/wishlist/:productId
// @access  Private
const toggleWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user._id);

    const index = user.wishlist.indexOf(productId);
    let action = '';

    if (index > -1) {
      // Remove from wishlist
      user.wishlist.splice(index, 1);
      action = 'removed';
    } else {
      // Add to wishlist
      user.wishlist.push(productId);
      action = 'added';
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: `Product ${action} wishlist`,
      wishlist: user.wishlist,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Record product view in browsing history
// @route   POST /api/auth/browsing-history/:productId
// @access  Private
const recordBrowsingHistory = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user._id);

    if (user) {
      // Filter out previous entry of the same product to move it to the top
      user.browsingHistory = user.browsingHistory.filter(
        (item) => item.product && item.product.toString() !== productId
      );

      user.browsingHistory.unshift({
        product: productId,
        viewedAt: new Date(),
      });

      // Keep only recent 20 items
      if (user.browsingHistory.length > 20) {
        user.browsingHistory = user.browsingHistory.slice(0, 20);
      }

      await user.save();
    }

    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
};

// @desc    Clear browsing history
// @route   DELETE /api/auth/browsing-history
// @access  Private
const clearBrowsingHistory = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { browsingHistory: [] });
    res.status(200).json({ success: true, message: 'Browsing history cleared' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registerUser,
  verifyOTP,
  resendOTP,
  forgotPassword,
  resetPassword,
  loginUser,
  getUserProfile,
  updateUserProfile,
  toggleWishlist,
  recordBrowsingHistory,
  clearBrowsingHistory,
};
