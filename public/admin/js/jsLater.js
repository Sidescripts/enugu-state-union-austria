// API Base URL - Update this to match your backend URL
const API_BASE_URL = '/api/v1/admin';

// Global state
let currentPage = 1;
let totalPages = 1;
let currentFilters = {
    search: '',
    isVerified: ''
};

// DOM Elements
const usersTableBody = document.getElementById('usersTableBody');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const verificationFilter = document.getElementById('verificationFilter');
const refreshBtn = document.getElementById('refreshBtn');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');
const modals = document.querySelectorAll('.modal');
const closeButtons = document.querySelectorAll('.close');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadUsers();
    setupEventListeners();
});

// Set up event listeners
function setupEventListeners() {
    // Search functionality
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
    
    // Filter functionality
    verificationFilter.addEventListener('change', function() {
        currentFilters.isVerified = this.value;
        currentPage = 1;
        loadUsers();
    });
    
    // Refresh button
    refreshBtn.addEventListener('click', function() {
        searchInput.value = '';
        verificationFilter.value = '';
        currentFilters = { search: '', isVerified: '' };
        currentPage = 1;
        loadUsers();
    });
    
    // Pagination
    prevPageBtn.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            loadUsers();
        }
    });
    
    nextPageBtn.addEventListener('click', function() {
        if (currentPage < totalPages) {
            currentPage++;
            loadUsers();
        }
    });
    
    // Modal close buttons
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            modals.forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Form submissions
    document.getElementById('updateBalanceForm').addEventListener('submit', handleUpdateBalance);
    document.getElementById('updateWithdrawalForm').addEventListener('submit', handleUpdateWithdrawal);
}

// Handle search
function handleSearch() {
    currentFilters.search = searchInput.value.trim();
    currentPage = 1;
    loadUsers();
}

// Load users from API
async function loadUsers() {
    try {
        showLoader();
        
        // Build query parameters
        const params = new URLSearchParams({
            page: currentPage,
            limit: 20
        });
        
        if (currentFilters.search) {
            params.append('search', currentFilters.search);
        }
        
        if (currentFilters.isVerified) {
            params.append('isVerified', currentFilters.isVerified);
        }
        
        const response = await fetch(`${API_BASE_URL}/users?${params}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            renderUsersTable(data.data.users);
            updatePagination(data.data);
        } else {
            showToast('Failed to load users: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showToast('Error loading users. Please try again.', 'error');
    } finally {
        hideLoader();
    }
}

// Render users table
function renderUsersTable(users) {
    usersTableBody.innerHTML = '';
    
    if (users.length === 0) {
        usersTableBody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; padding: 20px;">
                    No users found matching your criteria.
                </td>
            </tr>
        `;
        return;
    }
    
    users.forEach(user => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.username || 'N/A'}</td>
            <td>${user.email}</td>
            <td>${user.firstName || ''} ${user.lastName || ''}</td>
            <td>$${user.walletBalance?.toFixed(2) || '0.00'}</td>
            <td>$${user.totalWithdrawal?.toFixed(2) || '0.00'}</td>
            <td><span class="status-badge status-${user.status || 'inactive'}">${user.status || 'inactive'}</span></td>
            <td><span class="verified-badge verified-${user.isVerified}">${user.isVerified ? 'Verified' : 'Unverified'}</span></td>
            <td>${formatDate(user.createdAt)}</td>
            <td class="action-buttons">
                <button class="btn-primary" onclick="viewUserDetails(${user.id})">View</button>
                ${!user.isVerified ? `<button class="btn-success" onclick="verifyUser(${user.id})">Verify</button>` : ''}
                <button class="btn-warning" onclick="openUpdateBalanceModal(${user.id})">Balance</button>
                <button class="btn-warning" onclick="openUpdateWithdrawalModal(${user.id})">Withdrawal</button>
            </td>
        `;
        
        usersTableBody.appendChild(row);
    });
}

// Update pagination controls
function updatePagination(data) {
    totalPages = data.totalPages;
    pageInfo.textContent = `Page ${data.currentPage} of ${totalPages}`;
    
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
}

// View user details
async function viewUserDetails(userId) {
    try {
        showLoader();
        
        const response = await fetch(`${API_BASE_URL}/users/details?userId=${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            renderUserDetails(data.data);
            document.getElementById('userDetailsModal').style.display = 'block';
        } else {
            showToast('Failed to load user details: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('Error loading user details:', error);
        showToast('Error loading user details. Please try again.', 'error');
    } finally {
        hideLoader();
    }
}

// Render user details in modal
function renderUserDetails(user) {
    const content = document.getElementById('userDetailsContent');
    
    content.innerHTML = `
        <div class="user-details-grid">
            <div class="detail-card">
                <h3>Personal Information</h3>
                <div class="detail-item">
                    <span class="detail-label">ID:</span>
                    <span>${user.id}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Username:</span>
                    <span>${user.username || 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Email:</span>
                    <span>${user.email}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Name:</span>
                    <span>${user.firstName || ''} ${user.lastName || ''}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Phone:</span>
                    <span>${user.phoneNum || 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Country:</span>
                    <span>${user.country || 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Status:</span>
                    <span class="status-badge status-${user.status || 'inactive'}">${user.status || 'inactive'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Verified:</span>
                    <span class="verified-badge verified-${user.isVerified}">${user.isVerified ? 'Verified' : 'Unverified'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Joined Date:</span>
                    <span>${formatDate(user.createdAt)}</span>
                </div>
            </div>
            
            <div class="detail-card">
                <h3>Financial Information</h3>
                <div class="detail-item">
                    <span class="detail-label">Wallet Balance:</span>
                    <span>$${user.walletBalance?.toFixed(2) || '0.00'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Total Revenue:</span>
                    <span>$${user.totalRevenue?.toFixed(2) || '0.00'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Total Withdrawal:</span>
                    <span>$${user.totalWithdrawal?.toFixed(2) || '0.00'}</span>
                </div>
            </div>
            
            ${user.withdrawals && user.withdrawals.length > 0 ? `
            <div class="detail-card">
                <h3>Recent Withdrawals (${user.withdrawals.length})</h3>
                ${user.withdrawals.map(withdrawal => `
                    <div class="detail-item">
                        <span class="detail-label">$${withdrawal.amount?.toFixed(2)}</span>
                        <span>${withdrawal.status} - ${formatDate(withdrawal.createdAt)}</span>
                    </div>
                `).join('')}
            </div>
            ` : ''}
            
            ${user.deposits && user.deposits.length > 0 ? `
            <div class="detail-card">
                <h3>Recent Deposits (${user.deposits.length})</h3>
                ${user.deposits.map(deposit => `
                    <div class="detail-item">
                        <span class="detail-label">$${deposit.amount?.toFixed(2)}</span>
                        <span>${deposit.status} - ${formatDate(deposit.createdAt)}</span>
                    </div>
                `).join('')}
            </div>
            ` : ''}
            
            ${user.investments && user.investments.length > 0 ? `
            <div class="detail-card">
                <h3>Recent Investments (${user.investments.length})</h3>
                ${user.investments.map(investment => `
                    <div class="detail-item">
                        <span class="detail-label">$${investment.amount?.toFixed(2)}</span>
                        <span>${investment.plan?.name || 'N/A'} - ${investment.status}</span>
                    </div>
                `).join('')}
            </div>
            ` : ''}
        </div>
    `;
}

// Verify user
async function verifyUser(userId) {
    if (!confirm('Are you sure you want to verify this user?')) {
        return;
    }
    
    try {
        showLoader();
        
        const response = await fetch(`${API_BASE_URL}/users/${userId}/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('User verified successfully!', 'success');
            loadUsers(); // Refresh the table
        } else {
            showToast('Failed to verify user: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('Error verifying user:', error);
        showToast('Error verifying user. Please try again.', 'error');
    } finally {
        hideLoader();
    }
}

// Open update balance modal
function openUpdateBalanceModal(userId) {
    document.getElementById('balanceUserId').value = userId;
    document.getElementById('balanceAction').value = 'add';
    document.getElementById('balanceAmount').value = '';
    document.getElementById('updateBalanceModal').style.display = 'block';
}

// Handle update balance form submission
async function handleUpdateBalance(e) {
    e.preventDefault();
    
    const userId = document.getElementById('balanceUserId').value;
    const action = document.getElementById('balanceAction').value;
    const amount = document.getElementById('balanceAmount').value;
    
    if (!amount || parseFloat(amount) <= 0) {
        showToast('Please enter a valid amount', 'error');
        return;
    }
    
    try {
        showLoader();
        
        const response = await fetch(`${API_BASE_URL}/users/${userId}/balance`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({ action, amount: parseFloat(amount) })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Wallet balance updated successfully!', 'success');
            document.getElementById('updateBalanceModal').style.display = 'none';
            loadUsers(); // Refresh the table
        } else {
            showToast('Failed to update balance: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('Error updating balance:', error);
        showToast('Error updating balance. Please try again.', 'error');
    } finally {
        hideLoader();
    }
}

// Open update withdrawal modal
function openUpdateWithdrawalModal(userId) {
    document.getElementById('withdrawalUserId').value = userId;
    document.getElementById('withdrawalAction').value = 'add';
    document.getElementById('withdrawalAmount').value = '';
    document.getElementById('updateWithdrawalModal').style.display = 'block';
}

// Handle update withdrawal form submission
async function handleUpdateWithdrawal(e) {
    e.preventDefault();
    
    const userId = document.getElementById('withdrawalUserId').value;
    const action = document.getElementById('withdrawalAction').value;
    const amount = document.getElementById('withdrawalAmount').value;
    
    if (!amount || parseFloat(amount) <= 0) {
        showToast('Please enter a valid amount', 'error');
        return;
    }
    
    try {
        showLoader();
        
        const response = await fetch(`${API_BASE_URL}/users/${userId}/withdrawal`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({ action, amount: parseFloat(amount) })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Total withdrawal updated successfully!', 'success');
            document.getElementById('updateWithdrawalModal').style.display = 'none';
            loadUsers(); // Refresh the table
        } else {
            showToast('Failed to update withdrawal: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('Error updating withdrawal:', error);
        showToast('Error updating withdrawal. Please try again.', 'error');
    } finally {
        hideLoader();
    }
}

// Utility function to get auth token (you'll need to implement this based on your auth system)
function getAuthToken() {
    // This is a placeholder - implement based on your authentication system
    // Could be from localStorage, cookies, etc.
    return localStorage.getItem('adminAuthToken');
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Show toast notification
function showToast(message, type = 'info') {
    toastMessage.textContent = message;
    toast.className = 'toast show';
    
    // Set background color based on type
    if (type === 'error') {
        toast.style.backgroundColor = '#e74c3c';
    } else if (type === 'success') {
        toast.style.backgroundColor = '#2ecc71';
    } else {
        toast.style.backgroundColor = '#3498db';
    }
    
    // Hide after 3 seconds
    setTimeout(() => {
        toast.className = toast.className.replace('show', '');
    }, 3000);
}

// Show loader (you can implement a proper loader UI)
function showLoader() {
    // Implement your loading indicator here
    document.body.style.cursor = 'wait';
}

// Hide loader
function hideLoader() {
    // Implement your loading indicator here
    document.body.style.cursor = 'default';
}