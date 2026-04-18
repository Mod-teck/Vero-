require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const path = require('path');

const connectDB = require('./config/db');
const seedAdmin = require('./seeders/adminSeeder');
const adminAuthRoutes = require('./routes/adminAuth');
const dashboardRoutes  = require('./routes/dashboard');
const analyticsRoutes  = require('./routes/analytics');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// View Engine (EJS)
// ============================================

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ============================================
// Security Middleware
// ============================================

// Helmet: sets various HTTP security headers (CSP, X-Frame-Options, etc.)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
      },
    },
  })
);

// CORS: restrict origins — no wildcard even in development
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5000',
    credentials: true,
  })
);

// Rate limiting: prevent brute-force attacks on login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // max 10 attempts per window
  handler: (req, res) => {
    res.status(429).render('auth/login', {
      title: 'Vero Admin — Login',
      error: 'Too many login attempts. Please try again after 15 minutes.',
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================
// Body Parsing & Sanitization
// ============================================

app.use(express.json({ limit: '10kb' }));          // Limit body size
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Sanitize data to prevent MongoDB operator injection (strips $ and . from keys)
app.use(mongoSanitize());

// ============================================
// CSRF Protection
// ============================================

app.use(session({
  secret: 'yourSecretKey',
  resave: false,
  saveUninitialized: false
}));

const csrf = require('csurf');
const csrfProtection = csrf();
app.use(csrfProtection);

app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

// ============================================
// Static Files (CSS, JS assets only)
// ============================================

app.use(express.static(path.join(__dirname, 'public')));

// ============================================
// Routes
// ============================================

// Apply rate limiter specifically to login endpoint
app.use('/admin/login', loginLimiter);

// Mount the main router (handles /, /admin/login, /admin/logout)
app.use('/', adminAuthRoutes);

// Dashboard routes (/dashboard, /inventory/:category, /inventory/:category/:subCategory)
app.use('/', dashboardRoutes);

// Analytics routes (/analytics)
app.use('/', analyticsRoutes);

// ============================================
// 404 Handler
// ============================================

app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Page Not Found',
    statusCode: 404,
    message: 'The page you are looking for does not exist.',
  });
});

// ============================================
// Global Error Handler
// ============================================

app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).send('Invalid CSRF Token');
  }
  next(err);
});

app.use(errorHandler);

// ============================================
// Start Server
// ============================================

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Seed admin account on first run
    await seedAdmin();

    // Start listening
    app.listen(PORT, () => {
      console.log(`\n🚀 Vero Admin Server running on http://localhost:${PORT}`);
      console.log(`📋 Login page:  http://localhost:${PORT}/`);
      console.log(`📊 Dashboard:   http://localhost:${PORT}/dashboard\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};
startServer();
