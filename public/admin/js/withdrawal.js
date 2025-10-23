
// API Configuration
const API_BASE_URL = '/api/v1';
const WS_URL = 'ws://localhost:2000'; // Adjust based on your WebSocket setup
let currentWithdrawalId = null;
let currentUserId = null;
let currentAction = null;
let ws = null;

// DOM Elements
const pendingWithdrawalsBody = document.getElementById('pending-withdrawals-body');
const processedWithdrawalsBody = document.getElementById('processed-withdrawals-body');
const pendingSpinner = document.getElementById('pending-spinner');
const processedSpinner = document.getElementById('processed-spinner');
const pendingEmpty = document.getElementById('pending-empty');
const processedEmpty = document.getElementById('processed-empty');
const pendingCount = document.getElementById('pending-count');
const processedCount = document.getElementById('processed-count');

// Get auth token (assuming set elsewhere)
const authToken = localStorage.getItem('token'); // Replace with actual token source

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Setup event listeners
    setupEventListeners();
    
    // Load withdrawal data
    loadWithdrawalData();

    // Initialize WebSocket for real-time updates
    initializeWebSocket();
    
    // Fallback polling every 30 seconds
    setInterval(loadWithdrawalData, 30000);
});

// Initialize WebSocket connection
// function initializeWebSocket() {
//     try {
//         ws = new WebSocket(WS_URL);

//         ws.onopen = () => {
//             console.log('WebSocket connected');
//             ws.send(JSON.stringify({ type: 'subscribe', channel: 'withdrawals' }));
//         };

//         ws.onmessage = (event) => {
//             const data = JSON.parse(event.data);
//             if (data.type === 'withdrawalUpdate') {
//                 loadWithdrawalData(); // Refresh data on new withdrawal event
//             }
//         };

//         ws.onclose = () => {
//             console.log('WebSocket disconnected, attempting to reconnect...');
//             setTimeout(initializeWebSocket, 5000); // Attempt reconnect after 5 seconds
//         };

//         ws.onerror = (error) => {
//             console.error('WebSocket error:', error);
//         };
//     } catch (error) {
//         console.error('Failed to initialize WebSocket:', error);
//     }
// }

// Setup all event listeners
function setupEventListeners() {
    // Mobile sidebar toggle
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
    }

    // Tab switching
    const tabLinks = document.querySelectorAll('.nav-link');
    const tabContents = document.querySelectorAll('.tab-content');

    tabLinks.forEach(link => {
        link.addEventListener('click', () => {
            const tabId = link.getAttribute('data-tab');
            
            tabLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });
        });
    });

    // Edit Withdrawal Modal Functionality
    const withdrawalModal = document.getElementById('editWithdrawalModal');
    const closeWithdrawalModal = document.getElementById('closeWithdrawalModal');

    function closeWithdrawalModalFunc() {
        withdrawalModal.classList.remove('active');
        document.getElementById('addBalanceForm').reset();
        document.getElementById('subtractBalanceForm').reset();
        document.getElementById('addBalanceError').style.display = 'none';
        document.getElementById('subtractBalanceError').style.display = 'none';
    }

    if (closeWithdrawalModal) {
        closeWithdrawalModal.addEventListener('click', closeWithdrawalModalFunc);
    }

    if (withdrawalModal) {
        withdrawalModal.addEventListener('click', (e) => {
            if (e.target === withdrawalModal) {
                closeWithdrawalModalFunc();
            }
        });
    }

    // Handle form submissions for balance adjustment
    const addBalanceForm = document.getElementById('addBalanceForm');
    const subtractBalanceForm = document.getElementById('subtractBalanceForm');

    addBalanceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const amountInput = addBalanceForm.querySelector('input');
        const amount = parseFloat(amountInput.value);
        const errorElement = document.getElementById('addBalanceError');
        
        if (!amount || isNaN(amount) || amount < 0.01) {
            errorElement.style.display = 'block';
            return;
        }
        
        errorElement.style.display = 'none';
        showConfirmation('Add Balance', `Are you sure you want to add $${amount.toFixed(2)} to this user's balance?`, 
            () => adjustUserBalance(currentUserId, 'add', amount));
    });

    subtractBalanceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const amountInput = subtractBalanceForm.querySelector('input');
        const amount = parseFloat(amountInput.value);
        const errorElement = document.getElementById('subtractBalanceError');
        
        if (!amount || isNaN(amount) || amount < 0.01) {
            errorElement.style.display = 'block';
            return;
        }
        
        errorElement.style.display = 'none';
        showConfirmation('Subtract Balance', `Are you sure you want to subtract $${amount.toFixed(2)} from this user's balance?`, 
            () => adjustUserBalance(currentUserId, 'subtract', amount));
    });

    // Message Modal
    const messageModal = document.getElementById('messageModal');
    const closeMessageModal = document.getElementById('closeMessageModal');
    const confirmMessage = document.getElementById('confirmMessage');

    function closeMessageModalFunc() {
        messageModal.classList.remove('active');
    }

    if (closeMessageModal) {
        closeMessageModal.addEventListener('click', closeMessageModalFunc);
    }

    if (confirmMessage) {
        confirmMessage.addEventListener('click', closeMessageModalFunc);
    }

    if (messageModal) {
        messageModal.addEventListener('click', (e) => {
            if (e.target === messageModal) {
                closeMessageModalFunc();
            }
        });
    }

    // Confirmation Modal
    const confirmationModal = document.getElementById('confirmationModal');
    const closeConfirmationModal = document.getElementById('closeConfirmationModal');
    const cancelAction = document.getElementById('cancelAction');
    const confirmAction = document.getElementById('confirmAction');

    function closeConfirmationModalFunc() {
        confirmationModal.classList.remove('active');
        currentAction = null;
    }

    if (closeConfirmationModal) {
        closeConfirmationModal.addEventListener('click', closeConfirmationModalFunc);
    }

    if (cancelAction) {
        cancelAction.addEventListener('click', closeConfirmationModalFunc);
    }

    if (confirmAction) {
        confirmAction.addEventListener('click', () => {
            closeConfirmationModalFunc();
            if (currentAction) {
                currentAction();
            }
        });
    }

    if (confirmationModal) {
        confirmationModal.addEventListener('click', (e) => {
            if (e.target === confirmationModal) {
                closeConfirmationModalFunc();
            }
        });
    }
}

// Show confirmation modal
function showConfirmation(title, message, action) {
    const confirmationModal = document.getElementById('confirmationModal');
    const confirmationTitle = document.getElementById('confirmationTitle');
    const confirmationText = document.getElementById('confirmationText');
    
    confirmationTitle.textContent = title;
    confirmationText.textContent = message;
    currentAction = action;
    
    confirmationModal.classList.add('active');
}

// Show message modal
function showMessage(title, message, isSuccess = true) {
    const messageModal = document.getElementById('messageModal');
    const messageTitle = document.getElementById('messageTitle');
    const messageText = document.getElementById('messageText');
    const messageIcon = document.getElementById('messageIcon');
    
    messageTitle.textContent = title;
    messageText.textContent = message;
    
    messageIcon.innerHTML = isSuccess
        ? '<i class="fas fa-check-circle success-icon"></i>'
        : '<i class="fas fa-exclamation-circle error-icon"></i>';
    
    messageModal.classList.add('active');
}

// Load withdrawal data from API
async function loadWithdrawalData() {
    try {
        pendingSpinner.style.display = 'block';
        processedSpinner.style.display = 'block';
        pendingEmpty.style.display = 'none';
        processedEmpty.style.display = 'none';

        const response = await fetch(`${API_BASE_URL}/admin/withdrawal`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const withdrawals = await response.json();
        
        // Separate pending and processed withdrawals
        const pendingWithdrawals = Array.isArray(withdrawals) ? withdrawals.filter(w => w.status === 'pending') : [];
        const processedWithdrawals = Array.isArray(withdrawals) ? withdrawals.filter(w => w.status !== 'pending') : [];
        
        // Update counts
        pendingCount.textContent = pendingWithdrawals.length;
        processedCount.textContent = processedWithdrawals.length;
        
        // Render tables
        renderWithdrawalTable(pendingWithdrawals, pendingWithdrawalsBody, pendingSpinner, pendingEmpty, true);
        renderWithdrawalTable(processedWithdrawals, processedWithdrawalsBody, processedSpinner, processedEmpty, false);
    } catch (error) {
        console.error('Error loading withdrawal data:', error);
        showMessage('Error', `Failed to load withdrawal data: ${error.message}`, false);
        pendingSpinner.style.display = 'none';
        processedSpinner.style.display = 'none';
        pendingEmpty.style.display = 'block';
        processedEmpty.style.display = 'block';
    }
}

// Render withdrawal table
function renderWithdrawalTable(withdrawals, tableBody, spinner, emptyMsg, showActions) {
    spinner.style.display = 'none';
    
    if (!withdrawals || withdrawals.length === 0) {
        emptyMsg.style.display = 'block';
        tableBody.innerHTML = '';
        return;
    }
    
    emptyMsg.style.display = 'none';
    tableBody.innerHTML = '';
    
    withdrawals.forEach(withdrawal => {
        const row = document.createElement('tr');
        const requestDate = new Date(withdrawal.createdAt).toLocaleString();
        
        row.innerHTML = `
            <td>#WTH-${withdrawal._id}</td>
            <td>${withdrawal.userId?.username || 'Unknown User'}</td>
            <td>$${Number(withdrawal.amount).toFixed(2)}</td>
            <td>${withdrawal.method || 'N/A'}</td>
            <td>${requestDate}</td>
            ${showActions ? `
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-edit edit-withdrawal" 
                        data-id="${withdrawal._id}" 
                        data-user="${withdrawal.userId?.username || 'Unknown User'}" 
                        data-amount="${withdrawal.amount}" 
                        data-method="${withdrawal.method || 'N/A'}"
                        data-userid="${withdrawal.userId?._id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-primary approve-btn" 
                        data-id="${withdrawal._id}" 
                        data-userid="${withdrawal.userId?._id}" 
                        data-amount="${withdrawal.amount}">Approve</button>
                    <button class="btn btn-sm btn-danger reject-btn" 
                        data-id="${withdrawal._id}" 
                        data-userid="${withdrawal.userId?._id}" 
                        data-amount="${withdrawal.amount}">Reject</button>
                </div>
            </td>
            ` : `
            <td><span class="badge badge-${withdrawal.status}">${withdrawal.status}</span></td>
            `}
        `;
        
        tableBody.appendChild(row);
    });
    
    if (showActions) {
        tableBody.querySelectorAll('.edit-withdrawal').forEach(button => {
            button.addEventListener('click', () => {
                const transactionId = button.getAttribute('data-id');
                const user = button.getAttribute('data-user');
                const amount = button.getAttribute('data-amount');
                const method = button.getAttribute('data-method');
                const userId = button.getAttribute('data-userid');

                document.getElementById('withdrawalTransactionId').textContent = `#WTH-${transactionId}`;
                document.getElementById('withdrawalUser').textContent = user;
                document.getElementById('withdrawalAmount').textContent = `$${Number(amount).toFixed(2)}`;
                document.getElementById('withdrawalMethod').textContent = method;

                currentWithdrawalId = transactionId;
                currentUserId = userId;

                document.getElementById('editWithdrawalModal').classList.add('active');
            });
        });
        
        tableBody.querySelectorAll('.approve-btn').forEach(button => {
            button.addEventListener('click', () => {
                const withdrawalId = button.getAttribute('data-id');
                const userId = button.getAttribute('data-userid');
                const amount = parseFloat(button.getAttribute('data-amount'));
                showConfirmation('Approve Withdrawal', `Are you sure you want to approve this withdrawal of $${amount.toFixed(2)}?`, 
                    () => updateWithdrawalStatus(withdrawalId, 'approved', userId, amount));
            });
        });
        
        tableBody.querySelectorAll('.reject-btn').forEach(button => {
            button.addEventListener('click', () => {
                const withdrawalId = button.getAttribute('data-id');
                const userId = button.getAttribute('data-userid');
                const amount = parseFloat(button.getAttribute('data-amount'));
                showConfirmation('Reject Withdrawal', `Are you sure you want to reject this withdrawal of $${amount.toFixed(2)}?`, 
                    () => updateWithdrawalStatus(withdrawalId, 'rejected', userId, amount));
            });
        });
    }
}

// Update withdrawal status (approve/reject)
async function updateWithdrawalStatus(withdrawalId, status, userId, amount) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/withdrawal/${withdrawalId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ status })
        });

        if (!response.ok) {
            throw new Error(`Failed to update withdrawal status: ${response.statusText}`);
        }

        if (status === 'approved') {
            const balanceResponse = await fetch(`${API_BASE_URL}/admin/users/${userId}/balance`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ operation: 'subtract', amount })
            });

            if (!balanceResponse.ok) {
                throw new Error('Failed to update user balance');
            }

            const withdrawalResponse = await fetch(`${API_BASE_URL}/admin/users/${userId}/withdrawal`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ amount })
            });

            if (!withdrawalResponse.ok) {
                throw new Error('Failed to update user total withdrawal');
            }
        }

        showMessage('Success', `Withdrawal ${status} successfully`);
        loadWithdrawalData();
    } catch (error) {
        console.error('Error updating withdrawal status:', error);
        showMessage('Error', `Failed to update withdrawal status: ${error.message}`, false);
    }
}

// Adjust user balance (add/subtract)
async function adjustUserBalance(userId, operation, amount) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/balance`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ operation, amount })
        });

        if (!response.ok) {
            throw new Error(`Failed to adjust user balance: ${response.statusText}`);
        }

        showMessage('Success', `User balance ${operation === 'add' ? 'increased' : 'decreased'} by $${amount.toFixed(2)}`);
        document.getElementById('editWithdrawalModal').classList.remove('active');
        document.getElementById('addBalanceForm').reset();
        document.getElementById('subtractBalanceForm').reset();
        loadWithdrawalData();
    } catch (error) {
        console.error('Error adjusting user balance:', error);
        showMessage('Error', `Failed to adjust user balance: ${error.message}`, false);
    }
}
