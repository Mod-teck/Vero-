const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

/**
 * @desc    Authenticate admin and return JWT token
 * @route   POST /api/admin/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // --- 1. Find admin by username (Mongoose parameterized query — safe from injection) ---
    const admin = await Admin.findOne({ username });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.',
      });
    }

    // --- 2. Compare the provided password with the stored hash ---
    const isPasswordValid = await admin.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.',
      });
    }

    // --- 3. Generate JWT token ---
    const tokenPayload = {
      id: admin._id,
      username: admin.username,
      role: admin.role,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    });

    // --- 4. Update last login timestamp ---
    admin.lastLogin = new Date();
    await admin.save();

    // --- 5. Set httpOnly cookie + return JSON response ---
    res.cookie('token', token, {
      httpOnly: true,                                       // Not accessible via JavaScript
      secure: process.env.NODE_ENV === 'production',        // HTTPS only in production
      sameSite: 'strict',                                   // CSRF protection
      maxAge: 24 * 60 * 60 * 1000,                         // 24 hours in milliseconds
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token, // Also returned in body so the frontend can use Bearer header
      admin: {
        id: admin._id,
        username: admin.username,
        role: admin.role,
        lastLogin: admin.lastLogin,
      },
    });
  } catch (error) {
    next(error); // Forward to global error handler
  }
};

/**
 * @desc    Get admin dashboard (protected route - placeholder)
 * @route   GET /api/admin/dashboard
 * @access  Private (requires valid JWT)
 */
const getDashboard = (req, res) => {
  return res.status(200).json({
    success: true,
    message: `Welcome to the Vero Admin Dashboard, ${req.admin.username}!`,
    admin: req.admin,
  });
};

/**
 * @desc    Logout admin (clear cookie)
 * @route   POST /api/admin/logout
 * @access  Private
 */
const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

module.exports = {
  login,
  getDashboard,
  logout,
};
