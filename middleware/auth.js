const jwt = require('jsonwebtoken');

/**
 * Middleware: Verify JWT token from Authorization header or httpOnly cookie.
 * Attaches the decoded admin payload to req.admin on success.
 */
const verifyToken = (req, res, next) => {
  let token = null;

  // 1. Check Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // 2. Fallback: check httpOnly cookie
  if (!token && req.cookies) {
    token = req.cookies.token;
  }

  // No token found
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
    });
  }

  try {
    // Verify and decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    // Token is invalid or expired
    const message =
      error.name === 'TokenExpiredError'
        ? 'Token has expired. Please log in again.'
        : 'Invalid authentication token.';

    return res.status(401).json({
      success: false,
      message,
    });
  }
};

module.exports = { verifyToken };
