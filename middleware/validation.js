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
    .withMessage('Username may only contain letters, numbers, and hyphens.')
    .escape(), // Escapes HTML entities to prevent injection

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
 * Returns a 422 response with structured error details.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Map errors to a clean format
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

module.exports = {
  loginValidationRules,
  validate,
};
