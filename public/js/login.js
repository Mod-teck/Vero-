/**
 * Vero Admin — Login Page Client-Side Logic
 *
 * Handles:
 * - Frontend input validation (empty fields, suspicious patterns)
 * - Password visibility toggle
 * - API login request with loading states
 * - Error/success message display
 * - Redirect to dashboard on success
 */

(function () {
  'use strict';

  // ============================================
  // DOM References
  // ============================================

  const form = document.getElementById('loginForm');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const usernameError = document.getElementById('usernameError');
  const passwordError = document.getElementById('passwordError');
  const usernameGroup = document.getElementById('usernameGroup');
  const passwordGroup = document.getElementById('passwordGroup');
  const loginBtn = document.getElementById('loginBtn');
  const btnText = loginBtn.querySelector('.btn-text');
  const btnLoader = loginBtn.querySelector('.btn-loader');
  const messageArea = document.getElementById('messageArea');
  const passwordToggle = document.getElementById('passwordToggle');
  const eyeOpen = passwordToggle.querySelector('.eye-open');
  const eyeClosed = passwordToggle.querySelector('.eye-closed');

  // ============================================
  // Suspicious Pattern Detection
  // ============================================

  /**
   * Patterns that indicate potential injection attempts.
   * Blocks MongoDB operators ($, {}) and HTML/JS tags (<, >).
   */
  const SUSPICIOUS_PATTERNS = /[<>{}$]/;

  /**
   * Check if a string contains suspicious injection patterns.
   * @param {string} value - The input string to check.
   * @returns {boolean} True if suspicious patterns are found.
   */
  function hasSuspiciousPatterns(value) {
    return SUSPICIOUS_PATTERNS.test(value);
  }

  // ============================================
  // Validation Functions
  // ============================================

  /**
   * Validate the username field.
   * @returns {boolean} True if valid.
   */
  function validateUsername() {
    const value = usernameInput.value.trim();

    if (!value) {
      showFieldError(usernameGroup, usernameError, 'Username is required.');
      return false;
    }

    if (value.length < 3 || value.length > 30) {
      showFieldError(usernameGroup, usernameError, 'Username must be 3–30 characters.');
      return false;
    }

    if (hasSuspiciousPatterns(value)) {
      showFieldError(usernameGroup, usernameError, 'Username contains invalid characters.');
      return false;
    }

    clearFieldError(usernameGroup, usernameError);
    return true;
  }

  /**
   * Validate the password field.
   * @returns {boolean} True if valid.
   */
  function validatePassword() {
    const value = passwordInput.value;

    if (!value) {
      showFieldError(passwordGroup, passwordError, 'Password is required.');
      return false;
    }

    if (value.length < 8) {
      showFieldError(passwordGroup, passwordError, 'Password must be at least 8 characters.');
      return false;
    }

    clearFieldError(passwordGroup, passwordError);
    return true;
  }

  // ============================================
  // UI Helpers
  // ============================================

  /**
   * Display an error on a form field.
   */
  function showFieldError(group, errorSpan, message) {
    group.classList.add('error');
    errorSpan.textContent = message;
  }

  /**
   * Clear the error state from a form field.
   */
  function clearFieldError(group, errorSpan) {
    group.classList.remove('error');
    errorSpan.textContent = '';
  }

  /**
   * Show a message in the message area.
   * @param {string} text - Message text.
   * @param {'success'|'error'} type - Message type.
   */
  function showMessage(text, type) {
    messageArea.textContent = text;
    messageArea.className = 'message-area ' + type;
    messageArea.style.display = 'block';
  }

  /**
   * Hide the message area.
   */
  function hideMessage() {
    messageArea.style.display = 'none';
    messageArea.className = 'message-area';
    messageArea.textContent = '';
  }

  /**
   * Toggle loading state on the submit button.
   * @param {boolean} loading - Whether to show loading state.
   */
  function setLoading(loading) {
    loginBtn.disabled = loading;
    btnText.style.display = loading ? 'none' : 'inline';
    btnLoader.style.display = loading ? 'inline-flex' : 'none';
  }

  // ============================================
  // Password Toggle
  // ============================================

  passwordToggle.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    eyeOpen.style.display = isPassword ? 'none' : 'block';
    eyeClosed.style.display = isPassword ? 'block' : 'none';
  });

  // ============================================
  // Real-time Validation (on blur)
  // ============================================

  usernameInput.addEventListener('blur', validateUsername);
  passwordInput.addEventListener('blur', validatePassword);

  // Clear errors on input
  usernameInput.addEventListener('input', () => clearFieldError(usernameGroup, usernameError));
  passwordInput.addEventListener('input', () => clearFieldError(passwordGroup, passwordError));

  // ============================================
  // Form Submission
  // ============================================

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessage();

    // --- Client-side validation ---
    const isUsernameValid = validateUsername();
    const isPasswordValid = validatePassword();

    if (!isUsernameValid || !isPasswordValid) {
      return;
    }

    // --- Send login request ---
    setLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies in the request
        body: JSON.stringify({
          username: usernameInput.value.trim(),
          password: passwordInput.value,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Store token in sessionStorage as backup (cookie is primary)
        if (data.token) {
          sessionStorage.setItem('vero_admin_token', data.token);
        }

        showMessage('Login successful! Redirecting...', 'success');

        // Redirect to dashboard after a brief delay
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      } else {
        // Display server-side validation errors or generic error
        const errorMsg = data.errors
          ? data.errors.map((err) => err.message).join(' ')
          : data.message || 'Login failed. Please try again.';

        showMessage(errorMsg, 'error');
      }
    } catch (error) {
      showMessage('Network error. Please check your connection.', 'error');
    } finally {
      setLoading(false);
    }
  });
})();
