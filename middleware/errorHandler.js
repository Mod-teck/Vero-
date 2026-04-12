/**
 * Global error-handling middleware.
 * Catches unhandled errors, logs them in development, and returns
 * sanitized JSON responses to avoid leaking stack traces.
 */
const errorHandler = (err, req, res, _next) => {
  // Log full error in development for debugging
  if (process.env.NODE_ENV === 'development') {
    console.error('🔴 Error:', err);
  }

  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred.'
      : err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
