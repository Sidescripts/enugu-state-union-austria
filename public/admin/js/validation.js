// Wait for DOM to be fully loaded
    document.addEventListener('DOMContentLoaded', function() {
      // Global functions
      window.showPage = function(pageId) {
        document.querySelectorAll('.auth-pages').forEach(page => {
          page.classList.remove('active');
        });
        document.getElementById(pageId).classList.add('active');
        
        // Clear all error messages when switching pages
        document.querySelectorAll('.error-message').forEach(msg => {
          msg.style.display = 'none';
        });
      };

      window.togglePassword = function(inputId) {
        const passwordInput = document.getElementById(inputId);
        const eyeIcon = passwordInput.parentNode.querySelector('.fa-eye, .fa-eye-slash');
        
        if (passwordInput.type === 'password') {
          passwordInput.type = 'text';
          eyeIcon.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
          passwordInput.type = 'password';
          eyeIcon.classList.replace('fa-eye-slash', 'fa-eye');
        }
      };

      // Form validation for signup
      document.getElementById('signup-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('username-input').value.trim();
        const country = document.getElementById('country-input').value.trim();
        const email = document.getElementById('email-input').value.trim();
        const password = document.getElementById('password-input').value;
        const confirmPassword = document.getElementById('confirm-password-input').value;
        const errorMessage = document.getElementById('signup-error-message');

        // Reset error message
        errorMessage.style.display = 'none';
        errorMessage.textContent = '';

        // Validation
        let isValid = true;
        if (!username) {
          errorMessage.textContent = 'Username is required';
          isValid = false;
        } else if (!country) {
          errorMessage.textContent = 'Country is required';
          isValid = false;
        } else if (!email) {
          errorMessage.textContent = 'Email is required';
          isValid = false;
        } else if (!isValidEmail(email)) {
          errorMessage.textContent = 'Please enter a valid email address';
          isValid = false;
        } else if (!password) {
          errorMessage.textContent = 'Password is required';
          isValid = false;
        } else if (password.length < 8) {
          errorMessage.textContent = 'Password must be at least 8 characters long';
          isValid = false;
        } else if (password !== confirmPassword) {
          errorMessage.textContent = 'Passwords do not match';
          isValid = false;
        }

        if (!isValid) {
          errorMessage.style.display = 'block';
          return;
        }

        // If all validations pass
        // alert('Signup successful! Redirecting to login...');
        this.reset();
        // showPage('login-page');
      });

      // Form validation for login
      document.getElementById('login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('login-email-input').value.trim();
        const password = document.getElementById('login-password-input').value;
        const errorMessage = document.getElementById('login-error-message');

        // Reset error message
        errorMessage.style.display = 'none';
        errorMessage.textContent = '';

        // Validation
        let isValid = true;
        if (!email) {
          errorMessage.textContent = 'Email is required';
          isValid = false;
        } else if (!isValidEmail(email)) {
          errorMessage.textContent = 'Please enter a valid email address';
          isValid = false;
        } else if (!password) {
          errorMessage.textContent = 'Password is required';
          isValid = false;
        }

        if (!isValid) {
          errorMessage.style.display = 'block';
          return;
        }

        // If all validations pass
        // alert('Login successful! Redirecting to dashboard...');
        this.reset();
      });

      // Form validation for forgot password
      document.getElementById('forgot-password-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('forgot-email-input').value.trim();
        const errorMessage = document.getElementById('forgot-error-message');

        // Reset error message
        errorMessage.style.display = 'none';
        errorMessage.textContent = '';

        // Validation
        let isValid = true;
        if (!email) {
          errorMessage.textContent = 'Email is required';
          isValid = false;
        } else if (!isValidEmail(email)) {
          errorMessage.textContent = 'Please enter a valid email address';
          isValid = false;
        }

        if (!isValid) {
          errorMessage.style.display = 'block';
          return;
        }

        // If all validations pass
        alert('Password reset link sent to your email!');
        this.reset();
        showPage('new-password-page');
      });

      // Form validation for new password
      document.getElementById('new-password-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const password = document.getElementById('new-password-input').value;
        const confirmPassword = document.getElementById('confirm-new-password-input').value;
        const errorMessage = document.getElementById('new-password-error-message');

        // Reset error message
        errorMessage.style.display = 'none';
        errorMessage.textContent = '';

        // Validation
        let isValid = true;
        if (!password) {
          errorMessage.textContent = 'Password is required';
          isValid = false;
        } else if (password.length < 8) {
          errorMessage.textContent = 'Password must be at least 8 characters long';
          isValid = false;
        } else if (password !== confirmPassword) {
          errorMessage.textContent = 'Passwords do not match';
          isValid = false;
        }

        if (!isValid) {
          errorMessage.style.display = 'block';
          return;
        }

        // If all validations pass
        alert('Password updated successfully! Redirecting to login...');
        this.reset();
        showPage('login-page');
      });

      // Email validation helper function
      function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
      }
    });