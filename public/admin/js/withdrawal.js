
const WITHDRAWAL_API = "/api/v1/withdrawal/withdrawal";

// Validate form inputs
function validateWithdrawalForm() {
    const methodSelect = document.querySelector('#withdraw select[name="type"]');
    const amountInput = document.getElementById('amount');
    const walletInput = document.getElementById('walletAddress');
    const termsCheckbox = document.getElementById('c23');

    // Reset previous errors
    resetValidationStyles();

    let isValid = true;
    let errors = [];

    // Validate withdrawal method
    if (!methodSelect.value) {
        isValid = false;
        errors.push('Please select a withdrawal method');
        methodSelect.classList.add('is-invalid');
    }
    
    // Validate amount
    const amount = parseFloat(amountInput.value);
    if (!amountInput.value || isNaN(amount) || amount <= 0) {
        isValid = false;
        errors.push('Please enter a valid amount greater than 0');
        amountInput.classList.add('is-invalid');
    }

    // Validate wallet address
    if (!walletInput.value.trim()) {
        isValid = false;
        errors.push('Please enter a wallet address');
        walletInput.classList.add('is-invalid');
    } else if (walletInput.value.trim().length < 10) {
        isValid = false;
        errors.push('Wallet address appears to be too short');
        walletInput.classList.add('is-invalid');
    }

    // Validate terms acceptance
    if (!termsCheckbox.checked) {
        isValid = false;
        errors.push('Please accept the Terms of Service');
        termsCheckbox.classList.add('is-invalid');
    }

    if (!isValid) {
        Modal.error('Validation Error', errors.join('<br>'));
        return null;
    }

    return {
        method: methodSelect.value,
        displayMethod: methodSelect.options[methodSelect.selectedIndex].textContent.trim(),
        amount: amount,
        walletAddress: walletInput.value.trim()
    };
}

// Reset validation styles
function resetValidationStyles() {
    document.querySelectorAll('.is-invalid').forEach(el => {
        el.classList.remove('is-invalid');
    });
}

// Redirect to confirmation page with form data
function redirectToConfirmation(formData) {
    // Store form data in localStorage or sessionStorage to pass to confirmation page
    const withdrawalData = {
        withdrawalMethod: formData.method,
        displayMethod: formData.displayMethod,
        amount: formData.amount,
        walletAddress: formData.walletAddress,
        timestamp: new Date().toISOString()
    };

    localStorage.setItem('pendingWithdrawal', JSON.stringify(withdrawalData));
    
    // Redirect to confirmation page
    window.location.href = "../gratoms-dashboard/html/confirmWithdrawal.html";
}

// Submit withdrawal to server (to be called from confirmation page)
async function submitWithdrawal(formData) {
    
    try {
        
        const {withdrawalMethod, amount, walletAddress} = formData;
        const token = localStorage.getItem('token');
        const response = await fetch(WITHDRAWAL_API, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                withdrawalMethod: withdrawalMethod,
                amount: amount,
                walletAddress: walletAddress
            })
        });

        if(response.status == 401){
            Modal.error('Withdrawal Error', errorData.error || 'Withdrawal request failed')
            setTimeout(() => {
                window.location.href = "../../pages/login.html"
            }, 2000);
        }

        if (!response.ok) {
            const errorData = await response.json();
            Modal.error('Withdrawal Error', errorData.error || 'Withdrawal request failed')
            throw new Error(errorData.error || 'Withdrawal request failed');
        }else{
            Modal.success("Success", "Withdrawal is being processed");
            setTimeout(() => {
                window.location.href = "../Dashboard.html"
            }, 2000);

        }
    } catch (error) {
        console.error('Withdrawal error:', error);
        throw error;
    }
}


// Reset withdrawal form
function resetWithdrawalForm() {
    document.querySelector('#withdraw select[name="type"]').value = '';
    document.getElementById('amount').value = '';
    document.getElementById('walletAddress').value = '';
    document.getElementById('c23').checked = false;
    resetValidationStyles();
}

// Main validation function (called from HTML)
function validateBeforeRedirect() {
    const formData = validateWithdrawalForm();
    if (formData) {
        console.log('Withdrawal details:', formData);
        redirectToConfirmation(formData);
    }
}

// Add CSS for validation styles
const style = document.createElement('style');
style.textContent = `
    .is-invalid {
        border-color: #dc3545 !important;
        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23dc3545'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath d='m5.8 3.6.4.4.4-.4'/%3e%3cpath d='M6 7v1'/%3e%3c/svg%3e");
        background-repeat: no-repeat;
        background-position: right calc(0.375em + 0.1875rem) center;
        background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
    }
    .is-invalid + label {
        color: #dc3545 !important;
    }
    .form-check-input.is-invalid {
        border-color: #dc3545;
    }
    .form-check-input.is-invalid ~ .form-check-label {
        color: #dc3545;
    }
`
document.head.appendChild(style);

// Initialize form validation
document.addEventListener('DOMContentLoaded', function() {
    const withdrawElement = document.getElementById('withdraw');
    if (withdrawElement) {
        withdrawElement.addEventListener('shown.bs.offcanvas', function() {
            resetValidationStyles();
        });
    }
});