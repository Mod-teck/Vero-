"use strict";

const fs = require("fs");
const path = require("path");
const Product = require("../models/Product");
const dashboardService = require("../services/dashboardService");

const UPLOAD_DIR = path.join(__dirname, "..", "public", "uploads", "products");

/**
 * Safely resolve and validate a file path under the uploads directory.
 * Prevents path-traversal attacks by ensuring the resolved path
 * stays within UPLOAD_DIR.
 * @param {string} relativePath - The relative image path stored in DB
 * @returns {string|null} Absolute path if safe, null otherwise
 */
const safeImagePath = (relativePath) => {
  const resolved = path.resolve(UPLOAD_DIR, path.basename(relativePath));
  if (resolved.startsWith(UPLOAD_DIR)) return resolved;
  return null;
};

/**
 * Validate uploaded file MIME types (not just extension).
 * @param {object[]} files - multer file objects
 * @returns {string|null} Error message in Arabic if invalid, null if OK
 */
const validateImageMimes = (files) => {
  const allowed = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ];
  for (const file of files) {
    if (!allowed.includes(file.mimetype)) {
      return `نوع ملف غير مسموح: ${file.originalname} (${file.mimetype})`;
    }
  }
  return null;
};

/**
 * Parse sizes from the request body.
 * Accepts JSON string or already-parsed array of {size, quantity} objects.
 * @param {*} raw - req.body.sizes value
 * @returns {Array<{size: string, quantity: number}>}
 */
const parseSizes = (raw) => {
  let sizes = raw || [];
  if (typeof sizes === "string") {
    try {
      sizes = JSON.parse(sizes);
    } catch (e) {
      sizes = [];
    }
  }
  if (!Array.isArray(sizes)) sizes = [sizes];

  return sizes
    .filter(
      (entry) =>
        entry &&
        typeof entry === "object" &&
        typeof entry.size === "string" &&
        entry.size.trim() !== "",
    )
    .map((entry) => ({
      size: entry.size.trim(),
      quantity: Math.max(1, parseInt(entry.quantity, 10) || 1),
    }));
};

/**
 * @desc Render the Add Product form
 * @route GET /inventory/:category/add
 */
const getAddProductForm = async (req, res, next) => {
  try {
    const { category } = req.params;

    if (!dashboardService.VALID_CATEGORIES.has(category)) {
      return res.status(404).render("error", {
        title: "الصفحة غير موجودة",
        statusCode: 404,
        message: "التصنيف المطلوب غير موجود.",
      });
    }

    const categories = dashboardService.getInventoryCategories();
    const currentCategory = categories.find((c) => c.slug === category);

    res.render("inventory/addProduct", {
      title: `Vero Admin — Add Product (${currentCategory ? currentCategory.label : category})`,
      description: "إضافة منتج جديد",
      admin: req.admin,
      category,
      categoryLabel: currentCategory ? currentCategory.label : category,
      csrfToken: req.csrfToken(),
      error: req.flashError || null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Create a new product
 * @route POST /inventory/:category/add
 */
const createProduct = async (req, res, next) => {
  try {
    const { category } = req.params;

    // 1. Validate total uploaded images size (<= 5MB)
    if (req.files && req.files.length > 0) {
      const totalSize = req.files.reduce((acc, file) => acc + file.size, 0);
      if (totalSize > 5 * 1024 * 1024) {
        req.files.forEach((file) => {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
        req.flashError = "مجموع كل الصور يجب ألا يتجاوز 5 ميجابايت";
        return getAddProductForm(req, res, next);
      }

      // Validate MIME types server-side
      const mimeError = validateImageMimes(req.files);
      if (mimeError) {
        req.files.forEach((file) => {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
        req.flashError = mimeError;
        return getAddProductForm(req, res, next);
      }
    }

    // 2. Process images
    const images = req.files
      ? req.files.map((f) => `/uploads/products/${f.filename}`)
      : [];

    // 3. Process sizes (new format: [{size, quantity}])
    const sizes = parseSizes(req.body.sizes);

    // 4. Create the product
    const newProduct = await Product.create({
      name: req.body.name,
      description: req.body.description,
      category: category,
      sizes: sizes,
      price: parseFloat(req.body.price),
      discount: req.body.discount ? parseFloat(req.body.discount) : 0,
      images: images,
    });

    res.redirect(`/inventory/${category}`);
  } catch (error) {
    console.error("Error creating product:", error);
    // Map known Mongoose errors to user-friendly Arabic messages
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      req.flashError = messages.join(" — ");
      return getAddProductForm(req, res, next);
    }
    next(error);
  }
};

/**
 * @desc Render the Edit Product form, pre-populated with current data
 * @route GET /inventory/:category/:id/edit
 */
const getEditProductForm = async (req, res, next) => {
  try {
    const { category, id } = req.params;

    if (!dashboardService.VALID_CATEGORIES.has(category)) {
      return res.status(404).render("error", {
        title: "الصفحة غير موجودة",
        statusCode: 404,
        message: "التصنيف المطلوب غير موجود.",
      });
    }

    // Fetch by _id AND category to prevent cross-category edits
    const product = await Product.findOne({ _id: id, category }).lean();

    if (!product) {
      return res.status(404).render("error", {
        title: "المنتج غير موجود",
        statusCode: 404,
        message: "المنتج المطلوب غير موجود أو لا ينتمي لهذا التصنيف.",
      });
    }

    const categories = dashboardService.getInventoryCategories();
    const currentCategory = categories.find((c) => c.slug === category);

    res.render("inventory/editProduct", {
      title: `Vero Admin — تعديل: ${product.name}`,
      description: "تعديل بيانات المنتج",
      admin: req.admin,
      category,
      categoryLabel: currentCategory ? currentCategory.label : category,
      product,
      csrfToken: req.csrfToken(),
      error: req.flashError || null,
      formData: req.flashFormData || {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update an existing product
 * @route POST /inventory/:category/:id/edit
 */
const updateProduct = async (req, res, next) => {
  try {
    const { category, id } = req.params;

    if (!dashboardService.VALID_CATEGORIES.has(category)) {
      return res.status(404).render("error", {
        title: "الصفحة غير موجودة",
        statusCode: 404,
        message: "التصنيف المطلوب غير موجود.",
      });
    }

    // 1. Validate total uploaded images size (<= 5MB)
    if (req.files && req.files.length > 0) {
      const totalSize = req.files.reduce((acc, file) => acc + file.size, 0);
      if (totalSize > 5 * 1024 * 1024) {
        req.files.forEach((file) => {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
        req.flashError = "مجموع كل الصور يجب ألا يتجاوز 5 ميجابايت";
        req.flashFormData = req.body;
        return getEditProductForm(req, res, next);
      }

      const mimeError = validateImageMimes(req.files);
      if (mimeError) {
        req.files.forEach((file) => {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
        req.flashError = mimeError;
        req.flashFormData = req.body;
        return getEditProductForm(req, res, next);
      }
    }

    // 2. Process new images (append to existing)
    const newImages = req.files
      ? req.files.map((f) => `/uploads/products/${f.filename}`)
      : [];

    // 3. Process images to remove (comma-separated filenames from hidden field)
    const imagesToRemoveRaw = req.body.imagesToRemove || "";
    const imagesToRemove = imagesToRemoveRaw
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s !== "");

    // 4. Process sizes (new format)
    const sizes = parseSizes(req.body.sizes);

    // 5. Build update object
    const updateData = {
      name: req.body.name,
      description: req.body.description,
      sizes: sizes,
      price: parseFloat(req.body.price),
      discount: req.body.discount ? parseFloat(req.body.discount) : 0,
    };

    // 6. Fetch current product to merge images
    const currentProduct = await Product.findOne({ _id: id, category }).lean();
    if (!currentProduct) {
      return res.status(404).render("error", {
        title: "المنتج غير موجود",
        statusCode: 404,
        message: "المنتج المطلوب غير موجود أو لا ينتمي لهذا التصنيف.",
      });
    }

    // Remove specified images from the list and delete from disk
    let existingImages = currentProduct.images || [];
    const keptImages = existingImages.filter(
      (img) => !imagesToRemove.includes(path.basename(img)),
    );

    // Delete removed image files from disk (with path-traversal protection)
    for (const imgName of imagesToRemove) {
      const safePath = safeImagePath(imgName);
      if (safePath && fs.existsSync(safePath)) {
        try {
          fs.unlinkSync(safePath);
        } catch (unlinkErr) {
          console.error(
            "Failed to delete image file:",
            safePath,
            unlinkErr.message,
          );
        }
      }
    }

    updateData.images = [...keptImages, ...newImages];

    // 7. Perform the update
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: id, category },
      updateData,
      { new: true, runValidators: true },
    );

    if (!updatedProduct) {
      return res.status(404).render("error", {
        title: "المنتج غير موجود",
        statusCode: 404,
        message: "المنتج المطلوب غير موجود أو لا ينتمي لهذا التصنيف.",
      });
    }

    res.redirect(`/inventory/${category}`);
  } catch (error) {
    console.error("Error updating product:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      req.flashError = messages.join(" — ");
      req.flashFormData = req.body;
      return getEditProductForm(req, res, next);
    }
    next(error);
  }
};

/**
 * @desc Delete a product
 * @route DELETE /inventory/:category/:id
 */
const deleteProduct = async (req, res, next) => {
  try {
    const { category, id } = req.params;

    const product = await Product.findOneAndDelete({
      _id: id,
      category: category,
    });

    if (!product) {
      return res
        .status(404)
        .json({
          success: false,
          message: "المنتج غير موجود أو لا ينتمي لهذا القسم.",
        });
    }

    // Remove associated image files from disk (with path-traversal protection)
    if (product.images && product.images.length > 0) {
      product.images.forEach((imagePath) => {
        const fullPath = path.join(__dirname, "..", "public", imagePath);
        // Ensure resolved path is under public/uploads/products
        const resolved = path.resolve(fullPath);
        const allowedDir = path.resolve(
          path.join(__dirname, "..", "public", "uploads", "products"),
        );
        if (resolved.startsWith(allowedDir) && fs.existsSync(resolved)) {
          fs.unlinkSync(resolved);
        }
      });
    }

    res.json({ success: true, message: "تم حذف المنتج بنجاح." });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ success: false, message: "حدث خطأ أثناء الحذف." });
  }
};

module.exports = {
  getAddProductForm,
  createProduct,
  getEditProductForm,
  updateProduct,
  deleteProduct,
};
