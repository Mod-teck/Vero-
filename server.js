require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const path = require('path');

const connectDB = require('./config/db');
const seedAdmin = require('./seeders/adminSeeder');
const adminAuthRoutes = require('./routes/adminAuth');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

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

// CORS: restrict origins in production
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' ? process.env.CLIENT_URL : '*',
    credentials: true,
  })
);

// Rate limiting: prevent brute-force attacks on login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // max 10 attempts per window
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
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
// Static Files (Login Page)
// ============================================

app.use(express.static(path.join(__dirname, 'public')));

// ============================================
// API Routes
// ============================================

// Apply rate limiter specifically to login endpoint
app.use('/api/admin/login', loginLimiter);

// Mount admin auth routes
app.use('/api/admin', adminAuthRoutes);

// ============================================
// Fallback Routes
// ============================================

// Serve login page for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve dashboard page
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// 404 handler for unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found.',
  });
});

// ============================================
// Global Error Handler
// ============================================

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
      console.log(`📋 Login page: http://localhost:${PORT}/`);
      console.log(`🔑 Login API:  POST http://localhost:${PORT}/api/admin/login`);
      console.log(`📊 Dashboard:  GET  http://localhost:${PORT}/api/admin/dashboard\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
