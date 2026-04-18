'use strict';

const express = require('express');

const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

/**
 * @route   GET /analytics
 * @desc    Analytics page — detailed sales, expenses, and profit breakdown
 * @access  Private
 */
router.get('/analytics', verifyToken, analyticsController.getAnalytics);

module.exports = router;
