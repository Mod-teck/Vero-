"use strict";

const dashboardService = require("../services/dashboardService");
const { VALID_CATEGORIES } = dashboardService;
const Product = require("../models/Product");

/**
 * @desc  Render the main dashboard page
 *        (Orders section + Inventory categories + Sales summary)
 * @route GET /dashboard
 * @access Private
 */
const getDashboard = async (req, res, next) => {
  try {
    const [orderStats, salesStats, expenses] = await Promise.all([
      dashboardService.getOrderStats(),
      dashboardService.getSalesStats(),
      dashboardService.getExpensesTotal(),
    ]);

    const categories = dashboardService.getInventoryCategories();
    const profit = salesStats.total - expenses;

    return res.render("dashboard/index", {
      title: "Vero Admin — لوحة التحكم",
      description: "لوحة تحكم Vero الرئيسية",
      admin: req.admin,
      orderStats,
      categories,
      sales: salesStats.byStatus,
      salesTotal: salesStats.total,
      expenses,
      profit,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * @desc  Render the inventory category page (shows sub-categories)
 * @route GET /inventory/:category
 * @access Private
 */
const getInventoryCategory = async (req, res, next) => {
  try {
    // req.params.category is already sanitized by sanitizeParam middleware
    const { category } = req.params;

    if (!VALID_CATEGORIES.has(category)) {
      return res.status(404).render("error", {
        title: "الصفحة غير موجودة",
        statusCode: 404,
        message: "التصنيف المطلوب غير موجود.",
      });
    }

    const [subCategories, categories, products] = await Promise.all([
      dashboardService.getSubCategories(category),
      Promise.resolve(dashboardService.getInventoryCategories()),
      Product.find({ category }).sort({ createdAt: -1 }).lean(),
    ]);

    // Find the Arabic label for the current category
    const currentCategory = categories.find((c) => c.slug === category);

    return res.render("inventory/category", {
      title: `Vero Admin — ${currentCategory ? currentCategory.label : category}`,
      description: "صفحة تصنيف المخزون",
      admin: req.admin,
      category,
      categoryLabel: currentCategory ? currentCategory.label : category,
      categories,
      subCategories,
      products,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * @desc  Render the inventory sub-category page (shows items)
 * @route GET /inventory/:category/:subCategory
 * @access Private
 */
const getInventorySubCategory = async (req, res, next) => {
  try {
    const { category, subCategory } = req.params;

    if (!VALID_CATEGORIES.has(category)) {
      return res.status(404).render("error", {
        title: "الصفحة غير موجودة",
        statusCode: 404,
        message: "التصنيف المطلوب غير موجود.",
      });
    }

    const categories = dashboardService.getInventoryCategories();
    const currentCategory = categories.find((c) => c.slug === category);

    return res.render("inventory/subCategory", {
      title: `Vero Admin — ${subCategory}`,
      description: "صفحة الأصناف الفرعية",
      admin: req.admin,
      category,
      categoryLabel: currentCategory ? currentCategory.label : category,
      subCategory,
      categories,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getDashboard,
  getInventoryCategory,
  getInventorySubCategory,
};
