// Function to toggle password visibility
function togglePassword(inputId) {
    const passwordInput = document.getElementById(inputId);
    const toggleIcon = passwordInput.parentNode.querySelector('.password-toggle i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}


// Form validation function
function validateForm(formData) {
    const errors = [];

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
        errors.push('Email is required');
    } else if (!emailRegex.test(formData.email)) {
        errors.push('Please enter a valid email address');
    }
    
    // Password validation
    if (!formData.password) {
        errors.push('Password is required');
    } else if (formData.password.length < 6) {
        errors.push('Password must be at least 6 characters long');
    }
    
    return errors;
}
const submitButton = document.getElementById('submitButton');

// Function to handle form submission
async function handleLogin(event) {
    event.preventDefault();
    
    // Get form data
    const formData = {
        
        email: document.getElementById('login-email-input').value,
        password: document.getElementById('login-password-input').value
    };
    
    
    submitButton.disabled = true;
    submitButton.textContent = 'Processing...';
    
    // Validate form
    const errors = validateForm(formData);
    
    if (errors.length > 0) {
        // Show error modal with all validation errors
        Modal.error('error', errors.join(', '));
        submitButton.disabled = false;
        submitButton.textContent = 'Login';
        return;
    }

    try {
        
        const response = await fetch('/api/v1/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        // console.log(data)
        submitButton.disabled = false;
        submitButton.textContent = 'Login';

        if(response.ok){
            localStorage.removeItem('token')
            localStorage.setItem('token', data.token);
            localStorage.setItem('email', data.user.email);
            localStorage.setItem('username', data.user.username);
            submitButton.disabled = false;
            submitButton.textContent = 'Login';
            // console.log('Token received:', data.token);
            Modal.success('success', 'Welcome back to gratoms-trade. Redirecting to dashboard...');
            setTimeout(() =>{
                window.location.href = "../gratoms-dashboard/Dashboard.html"
            }, 2000)
        }else{
            // Enhanced error handling
            let errorMessage = 'Network error. Please try again later.';
            
            if (data.error) {
                errorMessage = data.error;
            } else if (data.message) {
                errorMessage = data.message;
            } else if (data.details && Array.isArray(data.details)) {
                errorMessage = data.details.map(detail => detail.message).join(', ');
            }
            submitButton.disabled = false;
            submitButton.textContent = 'Login';
            Modal.error('error', errorMessage);

        }
        
    } catch (error) {
        console.error('Signup error:', error);
        submitButton.disabled = false;
        submitButton.textContent = 'Login';
        Modal.error('error', 'Network error. Please check your connection and try again.');
    } finally {
        // Always re-enable the button
        submitButton.disabled = false;
        submitButton.textContent = 'Login';
    }
}

// Add event listener when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Add input event listeners for real-time validation styling
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value.trim() !== '') {
                this.classList.add('has-value');
            } else {
                this.classList.remove('has-value');
            }
        });
        
        // Initialize has-value class for pre-filled inputs
        if (input.value.trim() !== '') {
            input.classList.add('has-value');
        }
    });
});