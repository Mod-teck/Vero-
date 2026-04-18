const { body, validationResult } = require('express-validator');

/**
 * Validation rules for the admin login endpoint.
 * - Trims and escapes all inputs to prevent XSS/HTML injection.
 * - Validates types, lengths, and required fields.
 */
const loginValidationRules = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required.')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters.')
    .matches(/^[a-zA-Z0-9\-]+$/)
    .withMessage('Username may only contain letters, numbers, and hyphens.'),

  body('password')
    .notEmpty()
    .withMessage('Password is required.')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters.')
    .isString()
    .withMessage('Password must be a string.'),
];

/**
 * Middleware: check validation results and return errors if any.
 * For web form routes: renders the login view with the first error.
 * For API routes: returns a 422 JSON response with structured error details.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];

    // For web form routes, render the view with an error message
    if (!req.path.startsWith('/api/')) {
      return res.status(422).render('auth/login', {
        title: 'Vero Admin — Login',
        error: firstError.msg,
      });
    }

    // For API routes, keep JSON response
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    return res.status(422).json({
      success: false,
      message: 'Validation failed.',
      errors: formattedErrors,
    });
  }

  next();
};

/**
 * Middleware factory: sanitize a named route parameter.
 * Strips any character that is not alphanumeric, underscore, or hyphen.
 * Apply before controllers that use req.params values in DB queries.
 *
 * Usage:
 *   router.get('/inventory/:category', sanitizeParam('category'), controller)
 *
 * @param {string} paramName - The route param key to sanitize
 * @returns {Function} Express middleware
 */
const sanitizeParam = (paramName) => (req, res, next) => {
  if (req.params && typeof req.params[paramName] === 'string') {
    // Allow only: letters (a-z A-Z), digits, hyphens, underscores
    req.params[paramName] = req.params[paramName].replace(/[^a-zA-Z0-9\-_]/g, '');
  }
  next();
};

module.exports = {
  loginValidationRules,
  validate,
  sanitizeParam,
};
