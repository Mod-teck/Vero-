"use strict";

const express = require("express");

const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const { sanitizeParam } = require("../middleware/validation");
const dashboardController = require("../controllers/dashboardController");
const productController = require("../controllers/productController");
const upload = require("../middleware/upload");
const {
  productValidationRules,
  validateProduct,
} = require("../middleware/productValidation");

// ─────────────────────────────────────────────
// Dashboard Routes (all require authentication)
// ─────────────────────────────────────────────

/**
 * @route   GET /dashboard
 * @desc    Main dashboard: orders, inventory categories, sales summary
 * @access  Private
 */
router.get("/dashboard", verifyToken, dashboardController.getDashboard);

/**
 * @route   GET /inventory/:category
 * @desc    Inventory category page — shows sub-categories within a category
 * @access  Private
 */
router.get(
  "/inventory/:category",
  verifyToken,
  sanitizeParam("category"),
  dashboardController.getInventoryCategory,
);

/**
 * @route   GET /inventory/:category/add
 * @desc    Show add product form
 * @access  Private
 */
router.get(
  "/inventory/:category/add",
  verifyToken,
  sanitizeParam("category"),
  productController.getAddProductForm,
);

/**
 * @route   POST /inventory/:category/add
 * @desc    Create a new product
 * @access  Private
 */
router.post(
  "/inventory/:category/add",
  verifyToken,
  sanitizeParam("category"),
  upload.array("images", 5),
  productValidationRules,
  validateProduct,
  productController.createProduct,
);

/**
 * @route   DELETE /inventory/:category/:id
 * @desc    Delete a product
 * @access  Private
 */
router.delete(
  "/inventory/:category/:id",
  verifyToken,
  sanitizeParam("category"),
  sanitizeParam("id"),
  productController.deleteProduct,
);

/**
 * @route   GET /inventory/:category/:id/edit
 * @desc    Show edit product form
 * @access  Private
 */
router.get(
  "/inventory/:category/:id/edit",
  verifyToken,
  sanitizeParam("category"),
  sanitizeParam("id"),
  productController.getEditProductForm,
);

/**
 * @route   POST /inventory/:category/:id/edit
 * @desc    Update an existing product
 * @access  Private
 */
router.post(
  "/inventory/:category/:id/edit",
  verifyToken,
  sanitizeParam("category"),
  sanitizeParam("id"),
  upload.array("images", 5),
  productValidationRules,
  validateProduct,
  productController.updateProduct,
);

/**
 * @route   GET /inventory/:category/:subCategory
 * @desc    Inventory sub-category page — shows items within a sub-category
 * @access  Private
 */
router.get(
  "/inventory/:category/:subCategory",
  verifyToken,
  sanitizeParam("category"),
  sanitizeParam("subCategory"),
  dashboardController.getInventorySubCategory,
);

module.exports = router;
