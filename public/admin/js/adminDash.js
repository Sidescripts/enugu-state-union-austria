

// API Configuration
const API_BASE_URL = '/api/v1';
const WS_URL = 'ws://localhost:2000';
let ws = null;

// DOM Elements
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const logoutBtn = document.getElementById('logoutBtn');

// Stats Elements
const totalUsersEl = document.getElementById('totalUsers');
const activeUsersEl = document.getElementById('activeUsers');
const verifiedUsersEl = document.getElementById('verifiedUsers');
const totalDepositsEl = document.getElementById('totalDeposits');
const totalWithdrawalsEl = document.getElementById('totalWithdrawals');
const totalInvestmentsEl = document.getElementById('totalInvestments');
const todayDepositsEl = document.getElementById('todayDeposits');
const todayWithdrawalsEl = document.getElementById('todayWithdrawals');
const todayRegistrationsEl = document.getElementById('todayRegistrations');
const todayInvestmentsEl = document.getElementById('todayInvestments');

// Message Modal Elements
const messageModal = document.getElementById('messageModal');
const messageTitle = document.getElementById('messageTitle');
const messageText = document.getElementById('messageText');
const messageIcon = document.getElementById('messageIcon');
const closeMessageModal = document.getElementById('closeMessageModal');
const confirmMessage = document.getElementById('confirmMessage');

// Get auth token (assuming set elsewhere)
const authToken = localStorage.getItem('token');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    fetchDashboardStats();
    
});

// Setup event listeners
function setupEventListeners() {
    // Mobile sidebar toggle
    if (menuToggle && sidebar && sidebarOverlay) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSidebar();
        });

        sidebarOverlay.addEventListener('click', toggleSidebar);

        document.querySelectorAll('.sidebar-nav a').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth < 992) {
                    toggleSidebar();
                }
            });
        });
    }

    // Logout event listener
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }

    // Message modal
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
}

// Toggle sidebar on mobile
function toggleSidebar() {
    sidebar.classList.toggle('active');
    sidebarOverlay.classList.toggle('active');
    menuToggle.innerHTML = sidebar.classList.contains('active')
        ? '<i class="fas fa-times"></i>'
        : '<i class="fas fa-bars"></i>';
}

// Logout function (from original code, adapted)
function logout() {
    localStorage.removeItem('token'); // Adapted to match withdrawal page
    window.location.href = '../index.html'; // Adapted to match sidebar href
}

// Show message modal
function showMessage(title, message, isSuccess = true) {
    messageTitle.textContent = title;
    messageText.textContent = message;
    messageIcon.innerHTML = isSuccess
        ? '<i class="fas fa-check-circle success-icon"></i>'
        : '<i class="fas fa-exclamation-circle error-icon"></i>';
    messageModal.classList.add('active');
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Format number
function formatNumber(number) {
    return new Intl.NumberFormat('en-US').format(number);
}

// Initialize WebSocket connection
// function initializeWebSocket() {
//     try {
//         ws = new WebSocket(WS_URL);

//         ws.onopen = () => {
//             console.log('WebSocket connected');
//             ws.send(JSON.stringify({ type: 'subscribe', channel: 'dashboard' }));
//         };

//         ws.onmessage = (event) => {
//             const data = JSON.parse(event.data);
//             if (data.type === 'dashboardUpdate') {
//                 fetchDashboardStats();
//             }
//         };

//         ws.onclose = () => {
//             console.log('WebSocket disconnected, attempting to reconnect...');
//             setTimeout(initializeWebSocket, 5000);
//         };

//         ws.onerror = (error) => {
//             console.error('WebSocket error:', error);
//         };
//     } catch (error) {
//         console.error('Failed to initialize WebSocket:', error);
//     }
// }

// Fetch dashboard stats from API (adapted from original, now real)
async function fetchDashboardStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/dashboard/stats`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status == 401) {
            setTimeout(() =>{
                window.location.href ="../index.html"
            }, 2000);
        }

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log(data);

        if (data.success) {
            updateDashboardStats(data.data);
        } else {
            throw new Error(data.message || 'Failed to fetch dashboard stats');
        }
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        showMessage('Error', `Failed to load dashboard data: ${error.message}`, false);
        // Display error placeholders
        totalUsersEl.innerHTML = 'N/A';
        activeUsersEl.innerHTML = 'N/A';
        verifiedUsersEl.innerHTML = 'N/A';
        totalDepositsEl.innerHTML = 'N/A';
        totalWithdrawalsEl.innerHTML = 'N/A';
        totalInvestmentsEl.innerHTML = 'N/A';
        todayDepositsEl.innerHTML = 'N/A';
        todayWithdrawalsEl.innerHTML = 'N/A';
        todayRegistrationsEl.innerHTML = 'N/A';
        todayInvestmentsEl.innerHTML = 'N/A';
    }
}

// Update dashboard stats with fetched data (from original)
function updateDashboardStats(stats) {
    totalUsersEl.textContent = formatNumber(stats.overview.totalUsers || 0);
    activeUsersEl.textContent = formatNumber(stats.overview.activeUsers || 0);
    verifiedUsersEl.textContent = formatNumber(stats.overview.verifiedUsers || 0);
    totalDepositsEl.textContent = formatCurrency(stats.overview.totalDeposits || 0);
    totalWithdrawalsEl.textContent = formatCurrency(stats.overview.totalWithdrawals || 0);
    totalInvestmentsEl.textContent = formatCurrency(stats.overview.totalInvestments || 0);
    todayDepositsEl.textContent = formatCurrency(stats.today.deposits || 0);
    todayWithdrawalsEl.textContent = formatCurrency(stats.today.withdrawals || 0);
    todayRegistrationsEl.textContent = formatNumber(stats.today.registrations || 0);
    todayInvestmentsEl.textContent = formatCurrency(stats.today.investments || 0);
}