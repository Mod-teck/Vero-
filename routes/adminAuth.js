const express = require('express');
const router = express.Router();

const { login, getDashboard, logout } = require('../controllers/adminAuthController');
const { loginValidationRules, validate } = require('../middleware/validation');
const { verifyToken } = require('../middleware/auth');

/**
 * @route   POST /api/admin/login
 * @desc    Admin login with validation and sanitization
 */
router.post('/login', loginValidationRules, validate, login);

/**
 * @route   GET /api/admin/dashboard
 * @desc    Protected admin dashboard
 */
router.get('/dashboard', verifyToken, getDashboard);

/**
 * @route   POST /api/admin/logout
 * @desc    Admin logout (clears token cookie)
 */
router.post('/logout', verifyToken, logout);

module.exports = router;
