'use strict';

const dashboardService = require('../services/dashboardService');

/**
 * @desc  Render the analytics page (detailed sales, expenses, profit)
 * @route GET /analytics
 * @access Private
 */
const getAnalytics = async (req, res, next) => {
  try {
    const analyticsData = await dashboardService.getAnalyticsData();

    return res.render('analytics/index', {
      title: 'Vero Admin — التحليلات',
      description: 'صفحة المبيعات والمصاريف',
      admin: req.admin,
      sales:      analyticsData.sales.byStatus,
      salesTotal: analyticsData.sales.total,
      expenses:   analyticsData.expenses,
      profit:     analyticsData.profit,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getAnalytics };
