# Vero Admin Dashboard — Walkthrough

## What Was Built

A secure, server-side rendered (SSR) admin authentication system for the Vero e-commerce store. The project follows the MVC (Model-View-Controller) architecture using Node.js, Express, MongoDB (Mongoose), and EJS templates.

## Architecture: MVC + SSR

The project has been refactored from a client-side API architecture to a secure server-side model:
- **No Token in Frontend:** JWT is stored ONLY in `httpOnly` cookies. JavaScript cannot access the token (XSS protection).
- **Server-Side Rendering:** Dashboard data and error messages are rendered on the server via EJS.
- **Secure Sessions:** Uses `express-session` behaviors via JWT cookies with `SameSite=Strict` and `Secure` (in production).

## Project Structure

```
Vero/
├── config/
│   └── db.js                    # MongoDB Atlas connection
├── controllers/
│   └── adminAuthController.js   # Main logic (login/logout/render dashboard)
├── middleware/
│   ├── auth.js                  # JWT verification (cookie-based)
├── middleware/
│   ├── errorHandler.js          # Global error handler (renders error page)
├── middleware/
│   └── validation.js            # Input validation (express-validator)
├── models/
│   └── Admin.js                 # Mongoose schema + bcrypt hashing
├── public/
│   ├── css/style.css            # Premium dark glassmorphism UI
│   └── js/login.js              # Client-side validation & UI effects
├── routes/
│   └── adminAuth.js             # Route definitions (/, /dashboard, etc.)
├── seeders/
│   └── adminSeeder.js           # Auto-seeds default admin if none exists
├── views/
│   ├── auth/login.ejs           # Secure login portal
│   ├── dashboard/index.ejs      # Admin dashboard
│   ├── layouts/
│   │   ├── header.ejs           # Layout header partial
│   │   └── footer.ejs           # Layout footer partial
│   └── error.ejs                # Generic error page
├── server.js                    # Express app entry point & security config
├── .env                         # Environment variables (secrets)
└── package.json                 # Project dependencies
```

## Security Measures Implemented

| Measure | Implementation |
|---|---|
| **Password Hashing** | `bcrypt` with 12 salt rounds. |
| **JWT Storage** | `httpOnly`, `SameSite=Strict`, `Secure` (prod) cookies. |
| **XSS Protection** | EJS auto-escaping + Helmet Content Security Policy (CSP). |
| **CSRF Mitigation** | `SameSite=Strict` cookies (blocks cross-site token sending). |
| **Injections** | `express-mongo-sanitize` + Parameterized Mongoose queries. |
| **Brute Force** | `express-rate-limit` (10 attempts / 15 min) with custom handlers. |
| **Input Validation** | Strict server-side rules via `express-validator`. |

## How to Run

### 1. Environment Setup
The project requires a `.env` file (already created) with the following:
- `MONGODB_URI`: Your MongoDB Atlas connection string.
- `JWT_SECRET`: A strong cryptographic secret.
- `ADMIN_USERNAME`/`ADMIN_PASSWORD`: Default credentials for the seeder.

### 2. Start the Server
You can run the project using the included batch script:
```bash
./start.bat
```
Or manually:
```bash
npm install
npm run dev
```

### 3. Open the Dashboard
Navigate to: `http://localhost:5000`

## Core Endpoints

| Method | Route | Description |
|---|---|---|
| `GET` | `/` | Login page. Redirects to dashboard if already logged in. |
| `POST` | `/admin/login` | Processes login. Sets cookie and redirects to `/dashboard`. |
| `GET` | `/dashboard` | **Protected.** Renders admin information. |
| `POST` | `/admin/logout` | Clears the auth cookie and redirects to login. |
