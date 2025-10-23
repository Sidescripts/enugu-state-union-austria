
// Global variable to store the current deposit ID
let currentDepositId = null;
// console.log(currentDepositId)
// Function to fetch and render deposits
async function fetchAndRenderDeposits() {
    const token = localStorage.getItem("token");
    try {
        console.log("Token:", token);
        if (!token) throw new Error("No authentication token found");

        const response = await fetch('/api/v1/admin/deposit/all-deposit', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
        });

        if (response.status === 401) {
            setTimeout(() => {
                window.location.href = "../index.html"
            }, 2000);
            throw new Error(`Session expired. Login again: ${response.status}`);
        }

        if (!response.ok) {
            throw new Error(`Failed to fetch deposits: ${response.status}`);
        }

        const responseData = await response.json();
        console.log("API Response:", responseData);

        // Extract the deposits array
        const deposits = responseData.data.deposits || [];

        if (!Array.isArray(deposits)) {
            throw new Error('Deposits data is not an array');
        }

        // Get table bodies
        const pendingBody = document.querySelector('#pending-deposits tbody');
        const approvedBody = document.querySelector('#approved-deposits tbody');

        if (!pendingBody || !approvedBody) {
            throw new Error('Table bodies not found');
        }

        // Clear existing rows
        pendingBody.innerHTML = '';
        approvedBody.innerHTML = '';

        // Separate deposits by status
        const pendingDeposits = deposits.filter(deposit => deposit.status.toLowerCase() === 'pending');
        const approvedDeposits = deposits.filter(deposit => deposit.status.toLowerCase() === 'completed');

        // Update badge counts
        const pendingBadge = document.querySelector('[data-tab="pending-deposits"] .badge');
        const approvedBadge = document.querySelector('[data-tab="approved-deposits"] .badge');
        if (pendingBadge && approvedBadge) {
            pendingBadge.textContent = pendingDeposits.length;
            approvedBadge.textContent = approvedDeposits.length;
        } else {
            console.warn('Badge elements not found');
        }

        // Render pending deposits
        pendingDeposits.forEach(deposit => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${deposit.transaction_id}</td>
                <td>${deposit.user.username}</td>
                <td>$${parseFloat(deposit.amount).toFixed(2)}</td>
                <td>${deposit.asset}</td>
                <td>${new Date(deposit.createdAt).toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-edit edit-deposit" 
                                data-id="${deposit.id}" 
                                data-transaction-id="${deposit.transaction_id}"
                                data-user="${deposit.user.username}" 
                                data-amount="${deposit.amount}" 
                                data-asset="${deposit.asset}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-primary approve-deposit" data-id="${deposit.id}">Approve</button>
                        <button class="btn btn-sm btn-danger reject-deposit" data-id="${deposit.id}">Reject</button>
                    </div>
                </td>
            `;
            pendingBody.appendChild(row);
        });

        // Render approved deposits
        approvedDeposits.forEach(deposit => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${deposit.transaction_id}</td>
                <td>${deposit.user.username}</td>
                <td>$${parseFloat(deposit.amount).toFixed(2)}</td>
                <td>${deposit.asset}</td>
                <td>${new Date(deposit.createdAt).toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                <td><span class="badge badge-approved">Approved</span></td>
            `;
            approvedBody.appendChild(row);
        });

        // Attach event listeners for edit buttons
        attachEditButtonListeners();
        
        // Attach event listeners for approve/reject buttons
        attachActionButtonListeners();
    } catch (error) {
        console.error('Error fetching deposits:', error);
        alert('Failed to load deposits: ' + error.message);
    }
}

// Function to update a deposit
async function updateDeposit(event) {
    event.preventDefault(); // Prevent form submission from redirecting
    // console.log(currentDepositId)

    if (!currentDepositId) {
        alert('No deposit selected for update');
        return;
    }

    const amount = document.getElementById('amt').value;
    const asset = document.getElementById('mtd').value;
    const token = localStorage.getItem('token');
    console.log(amount , asset)
    if (!amount || !asset) {
        alert('Please fill in all fields');
        return;
    }
    
    // console.log({id: currentDepositId, amount: amount, asset: asset})
    try {
        console.log('Updating deposit:', { currentDepositId, amount, asset });
        const response = await fetch(`/api/v1/admin/deposit/${currentDepositId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                depositId: currentDepositId, 
                amount: parseFloat(amount), 
                asset 
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Failed to update deposit: ${errorData.message || response.status}`);
        }

        // event.target.reset();
        closeEditModalFunc();
        await fetchAndRenderDeposits();
        alert('Deposit updated successfully!');
    } catch (error) {
        console.error('Error updating deposit:', error);
        alert(`Failed to update deposit: ${error.message}`);
    }
}

// Function to handle edit modal
function attachEditButtonListeners() {
    const editButtons = document.querySelectorAll('.edit-deposit');
    const editModal = document.getElementById('editDepositModal');
    if (!editModal) {
        console.error('Modal element #editDepositModal not found');
        return;
    }

    editButtons.forEach(button => {
        button.addEventListener('click', () => {
            console.log('Edit button clicked:', button.dataset);
            
            // Store the deposit ID in the global variable
            currentDepositId = button.dataset.id;
            
            // Populate modal fields
            const transactionId = document.getElementById('modalTransactionId');
            const user = document.getElementById('modalUser');
            const amountDisplay = document.getElementById('modalAmount');
            const methodDisplay = document.getElementById('modalMethod');
            if (transactionId && user && amountDisplay && methodDisplay) {
                transactionId.textContent = `#${button.dataset.transactionId}`;
                user.textContent = button.dataset.user;
                amountDisplay.textContent = `$${parseFloat(button.dataset.amount).toFixed(2)}`;
                methodDisplay.textContent = button.dataset.asset;
            } else {
                console.error('Modal display elements not found');
            }

            // Populate form fields
            const amountInput = document.getElementById('amount');
            const methodInput = document.getElementById('method');
            if (amountInput && methodInput) {
                amountInput.value = parseFloat(button.dataset.amount).toFixed(2);
                methodInput.value = button.dataset.asset;
            } else {
                console.error('Form inputs not found');
            }

            // Show modal
            editModal.classList.add('active');
        });
    });
}

// Function to attach event listeners to approve/reject buttons
function attachActionButtonListeners() {
    const approveButtons = document.querySelectorAll('.approve-deposit');
    const rejectButtons = document.querySelectorAll('.reject-deposit');
    
    approveButtons.forEach(button => {
        button.addEventListener('click', () => {
            handleDepositAction(button.dataset.id, 'approve');
        });
    });
    
    rejectButtons.forEach(button => {
        button.addEventListener('click', () => {
            handleDepositAction(button.dataset.id, 'reject');
        });
    });
}

// Function to close modal
function closeEditModalFunc() {
    const editModal = document.getElementById('editDepositModal');
    if (editModal) {
        editModal.classList.remove('active');
        const depositForm = document.getElementById('depositForm');
        if (depositForm) depositForm.reset();
    }
}

// Function to handle approve/reject actions
async function handleDepositAction(depositId, action) {
    const token = localStorage.getItem('token');
    try {
        console.log(`Processing deposit action: ${action} for depositId: ${depositId}`);
        const response = await fetch(`/api/v1/admin/deposit/${depositId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ depositId, status: action === 'approve' ? 'completed' : 'rejected' }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Failed to ${action} deposit: ${errorData.message || response.status}`);
        }

        await fetchAndRenderDeposits();
        alert(`Deposit ${action}ed successfully!`);
    } catch (error) {
        console.error(`Error ${action}ing deposit:`, error);
        alert(`Failed to ${action} deposit: ${error.message}`);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Fetch deposits
    fetchAndRenderDeposits();

    // Sidebar toggle
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    if (menuToggle && sidebar && sidebarOverlay) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            sidebarOverlay.classList.toggle('active');
        });

        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });
    } else {
        console.warn('Sidebar elements not found');
    }

    // Tab switching
    const tabLinks = document.querySelectorAll('.nav-link');
    const tabContents = document.querySelectorAll('.tab-content');

    tabLinks.forEach(link => {
        link.addEventListener('click', () => {
            tabLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === link.getAttribute('data-tab')) {
                    content.classList.add('active');
                }
            });
        });
    });

    // Modal setup
    const editModal = document.getElementById('editDepositModal');
    const closeEditModal = document.getElementById('closeEditModal');

    // Close modal button
    if (closeEditModal) {
        closeEditModal.addEventListener('click', closeEditModalFunc);
    } else {
        console.warn('Close modal button not found');
    }

    // Close modal on outside click
    if (editModal) {
        editModal.addEventListener('click', (e) => {
            if (e.target === editModal) {
                closeEditModalFunc();
            }
        });
    } else {
        console.error('Modal element #editDepositModal not found');
    }
    const dBtn = document.getElementById('addBtn');

    // Deposit form submission (for updates)
    // const depositForm = document.getElementById('depositForm');
    if (editModal) {
        dBtn.addEventListener('click', updateDeposit)
        // editModal.addEventListener('submit', updateDeposit);
    } else {
        console.error('Deposit modal form not found');
    }
});