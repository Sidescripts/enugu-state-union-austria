document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const signupForm = document.getElementById('signupForm');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const toggleConfirmPasswordBtn = document.getElementById('toggleConfirmPassword');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const submitBtn = document.getElementById('submitBtn');
    const btnLoader = document.getElementById('btnLoader');
    const btnText = document.querySelector('.btn-text');
    const modal = document.getElementById('modal');
    const modalIcon = document.getElementById('modalIcon');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalButton = document.getElementById('modalButton');
    const strengthBar = document.querySelector('.strength-bar');

    // Toggle password visibility
    togglePasswordBtn.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.querySelector('i').classList.toggle('fa-eye');
        this.querySelector('i').classList.toggle('fa-eye-slash');
    });

    // Toggle confirm password visibility
    toggleConfirmPasswordBtn.addEventListener('click', function() {
        const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        confirmPasswordInput.setAttribute('type', type);
        this.querySelector('i').classList.toggle('fa-eye');
        this.querySelector('i').classList.toggle('fa-eye-slash');
    });

    // Password strength indicator
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        let strength = 0;
        
        if (password.length >= 8) strength += 25;
        if (/[A-Z]/.test(password)) strength += 25;
        if (/[0-9]/.test(password)) strength += 25;
        if (/[^A-Za-z0-9]/.test(password)) strength += 25;
        
        strengthBar.style.width = strength + '%';
        
        if (strength < 50) {
            strengthBar.style.background = '#e74c3c';
        } else if (strength < 75) {
            strengthBar.style.background = '#f39c12';
        } else {
            strengthBar.style.background = '#2ecc71';
        }
    });

    // Form validation
    function validateForm() {
        let isValid = true;
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        // Name validation
        if (name === '') {
            showError('nameError', 'Full name is required');
            isValid = false;
        } else if (name.length < 3) {
            showError('nameError', 'Name must be at least 3 characters');
            isValid = false;
        } else {
            hideError('nameError');
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email === '') {
            showError('emailError', 'Email is required');
            isValid = false;
        } else if (!emailRegex.test(email)) {
            showError('emailError', 'Please enter a valid email address');
            isValid = false;
        } else {
            hideError('emailError');
        }

        // Password validation
        if (password === '') {
            showError('passwordError', 'Password is required');
            isValid = false;
        } else if (password.length < 8) {
            showError('passwordError', 'Password must be at least 8 characters');
            isValid = false;
        } else {
            hideError('passwordError');
        }

        // Confirm password validation
        if (confirmPassword === '') {
            showError('confirmPasswordError', 'Please confirm your password');
            isValid = false;
        } else if (confirmPassword !== password) {
            showError('confirmPasswordError', 'Passwords do not match');
            isValid = false;
        } else {
            hideError('confirmPasswordError');
        }

        return isValid;
    }

    // Show error message
    function showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    // setTimeout(() =>{
    //     errorElement.textContent = '';
    //     errorElement.style.display = 'none';
 
    // }, 5000)
    // Hide error message
    function hideError(elementId) {
        const errorElement = document.getElementById(elementId);
        // errorElement.textContent = '';
        // errorElement.style.display = 'none';
        setTimeout(() =>{
            errorElement.textContent = '';
            errorElement.style.display = 'none';
     
        }, 5000)
    }

    // Show modal
    function showModal(type, title, message) {
        modalIcon.className = 'modal-icon';
        if (type === 'success') {
            modalIcon.classList.add('success');
            modalIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
        } else {
            modalIcon.classList.add('error');
            modalIcon.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
        }
        
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modal.classList.add('active');
    }

    // Hide modal
    function hideModal() {
        modal.classList.remove('active');
    }

    // Form submission
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        const d = {
            username: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            password: document.getElementById('password').value
        }
        // Show loading state
        submitBtn.disabled = true;
        btnText.textContent = 'Processing...';
        btnLoader.style.display = 'flex';
        
        try {
            
            const response = await fetch('/api/v1/admin/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(d)
            });
            
            const data = await response.json();
            console.log(data)
            if (response.ok) {
                const {token} = data;
                localStorage.setItem("email", data.admin.email)
                localStorage.setItem("token", token)
                showModal('success', 'Success', 'Your account has been created successfully!');
                window.location.href = "../html/adminDash.html"
            } else {
                throw new Error(data.message || 'Something went wrong');
            }
            
            
        } catch (error) {
            showModal('error', 'Error', error.message || 'Failed to create account. Please try again.');
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            btnText.textContent = 'Create Account';
            btnLoader.style.display = 'none';
        }
    });

    // Modal button event
    modalButton.addEventListener('click', hideModal);
});