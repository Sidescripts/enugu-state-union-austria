document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const loginForm = document.getElementById('loginForm');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('loginBtn');
    const btnLoader = document.getElementById('btnLoader');
    const btnText = document.querySelector('.btn-text');
    const modal = document.getElementById('modal');
    const modalIcon = document.getElementById('modalIcon');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalButton = document.getElementById('modalButton');

    // Toggle password visibility
    togglePasswordBtn.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.querySelector('i').classList.toggle('fa-eye');
        this.querySelector('i').classList.toggle('fa-eye-slash');
    });

    // Form validation
    function validateForm() {
        let isValid = true;
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

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
        } else {
            hideError('passwordError');
        }

        return isValid;
    }

    // Show error message
    function showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    // Hide error message
    function hideError(elementId) {
        const errorElement = document.getElementById(elementId);
        setTimeout(() =>{
            errorElement.textContent = '';
            errorElement.style.display = 'none';
     
        }, 5000)
        // errorElement.textContent = '';
        // errorElement.style.display = 'none';
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
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        // Show loading state
        loginBtn.disabled = true;
        btnText.textContent = 'Signing In...';
        btnLoader.style.display = 'flex';
        
        try {
            
            const response = await fetch('/api/v1/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: document.getElementById('email').value.trim(),
                    password: document.getElementById('password').value
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                console.log(data)
                const {email, token} = data;
                localStorage.setItem("email", data.admin.email)
                localStorage.setItem("token", token)
                showModal('success', 'Success', 'You have successfully logged in!');
                window.location.href = "./html/adminDash.html"
            

            } else {
                throw new Error(data.message || 'Invalid credentials');
            }
                        
             
        } catch (error) {
            showModal('error', 'Error', error.message || 'Invalid email or password. Please try again.');
        } finally {
            // Reset button state
            loginBtn.disabled = false;
            btnText.textContent = 'Sign In';
            btnLoader.style.display = 'none';
        }
    });

    // Modal button event
    modalButton.addEventListener('click', hideModal);
});