document.addEventListener('DOMContentLoaded', () => {
    class DashboardManager {
        constructor() {
            this.constants = {
                PRELOADER: document.getElementById('preloader'),
                API_ENDPOINT: '/api/v1/user/dashboard',
                LOGIN_PAGE: '../pages/login.html',
                REFRESH_INTERVAL: 120000, // 2 minutes in milliseconds
                SELECTORS: {
                    username: '#username',
                    totalBalance: '.card-top h1',
                    revenue: '.rev',
                    activeInvestments: '.active-revenue',
                    totalRevenue: '.rev-sum',
                    totalWithdrawal: '.withdrawal-summary',
                    btcBalance: '.btcEqu',
                    ethBalance: '.ethEqu',
                    usdtBalance: '.usdtEqu'
                }
            };
            
            this.refreshIntervalId = null;
            this.init();
        }

        /**
         * Initialize the dashboard
         */
        init() {
            this.hidePreloader();
            this.fetchDashboardData();
            this.startAutoRefresh();
        }

        /**
         * Start auto-refresh interval
         */
        startAutoRefresh() {
            // Clear any existing interval first
            this.stopAutoRefresh();
            
            // Set new interval
            this.refreshIntervalId = setInterval(() => {
                console.log('Auto-refreshing dashboard data...');
                this.fetchDashboardData();
            }, this.constants.REFRESH_INTERVAL);
        }

        /**
         * Stop auto-refresh interval
         */
        stopAutoRefresh() {
            if (this.refreshIntervalId) {
                clearInterval(this.refreshIntervalId);
                this.refreshIntervalId = null;
            }
        }

        /**
         * Restart auto-refresh (useful after manual refresh or errors)
         */
        restartAutoRefresh() {
            this.stopAutoRefresh();
            this.startAutoRefresh();
        }

        /**
         * Hide the preloader when page loads
         */
        hidePreloader() {
            if (this.constants.PRELOADER) {
                this.constants.PRELOADER.style.display = 'none';
            }
        }

        /**
         * Format currency values
         * @param {number} value - The value to format
         * @param {number} decimals - Number of decimal places
         * @returns {string} Formatted currency string
         */
        formatCurrency(value, decimals = 2) {
            return isNaN(value) ? '$0.00' : `$${Number(value).toFixed(decimals)}`;
        }

        /**
         * Redirect user to login page
         */
        redirectToLogin() {
            this.stopAutoRefresh(); // Clean up interval before redirect
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            window.location.href = this.constants.LOGIN_PAGE;
        }

        /**
         * Handle API response errors
         * @param {Response} response - Fetch response object
         */
        async handleResponseError(response) {
            if (response.status === 401) {
                const data = await response.json().catch(() => ({}));
                
                if (data.message?.toLowerCase().includes('token expired') || 
                    data.error?.toLowerCase().includes('token expired')) {
                    Modal.error('Session Expired', 'Your session has expired. Please log in again.');
                } else {
                    Modal.error('Authentication Error', 'Unauthorized access. Please log in.');
                }
                
                setTimeout(() => this.redirectToLogin(), 2000);
                return;
            }
            
            Modal.error('Response Error', 'Failed to load dashboard');
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        /**
         * Fetch dashboard data from API
         */
        async fetchDashboardData() {
            const token = localStorage.getItem('token');

            if (!token) {
                Modal.error('Token Error', 'Please login again');
                setTimeout(() => this.redirectToLogin(), 2000);
                return;
            }

            try {
                const response = await fetch(this.constants.API_ENDPOINT, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    await this.handleResponseError(response);
                    return;
                }

                const data = await response.json();
                console.log('Dashboard data:', data);
                this.updateDashboard(data);

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                Modal.error('Server Error', 'Failed to load dashboard due to a network error');
                
                // Optionally restart auto-refresh on error after a delay
                setTimeout(() => this.restartAutoRefresh(), 30000); // Retry after 30 seconds
            }
        }

        /**
         * Update DOM element with value
         * @param {string} selector - CSS selector
         * @param {string} value - Value to display
         */
        updateElement(selector, value) {
            const element = document.querySelector(selector);
            
            if (element) {
                element.textContent = value;
            } else {
                console.warn(`Element not found for selector: ${selector}`);
            }
        }

        /**
         * Validate dashboard data structure
         * @param {Object} data - Dashboard data
         * @returns {boolean} True if data is valid
         */
        validateData(data) {
            if (!data || typeof data !== 'object') {
                Modal.error('Data Error', 'Invalid dashboard data received');
                return false;
            }
            return true;
        }

        /**
         * Update dashboard UI with fetched data
         * @param {Object} data - Dashboard data from API
         */
        updateDashboard(data) {
            if (!this.validateData(data)) return;

            const {
                walletBalance = 0,
                totalRevenue = 0,
                activeInvestments = 0,
                totalWithdrawal = 0,
                revenue = 0,
                btcBal = 0,
                ethBal = 0,
                usdtBal = 0
            } = data;

            const username = localStorage.getItem('username') || 'User';
            const { SELECTORS } = this.constants;

            // Update all dashboard elements
            const updates = [
                [SELECTORS.username, username],
                [SELECTORS.totalBalance, this.formatCurrency(walletBalance, 3)],
                [SELECTORS.totalRevenue, this.formatCurrency(totalRevenue, 3)],
                [SELECTORS.activeInvestments, this.formatCurrency(activeInvestments, 2)],
                [SELECTORS.revenue, this.formatCurrency(revenue, 2)],
                [SELECTORS.totalWithdrawal, this.formatCurrency(totalWithdrawal, 2)],
                [SELECTORS.btcBalance, this.formatCurrency(btcBal, 2)],
                [SELECTORS.ethBalance, this.formatCurrency(ethBal, 2)],
                [SELECTORS.usdtBalance, this.formatCurrency(usdtBal, 2)]
            ];

            updates.forEach(([selector, value]) => {
                this.updateElement(selector, value);
            });
        }

        /**
         * Clean up resources when dashboard is no longer needed
         */
        destroy() {
            this.stopAutoRefresh();
        }
    }

    // Initialize the dashboard when DOM is loaded
    const dashboardManager = new DashboardManager();

    // Optional: Add manual refresh capability
    document.addEventListener('keydown', (event) => {
        // Ctrl + R for manual refresh (optional feature)
        if (event.ctrlKey && event.key === 'r') {
            event.preventDefault();
            dashboardManager.fetchDashboardData();
            dashboardManager.restartAutoRefresh();
        }
    });

    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
        dashboardManager.destroy();
    });
});