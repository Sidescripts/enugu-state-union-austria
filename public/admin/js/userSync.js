// userSync.js
// This file keeps the user table updated with new users from the server

document.addEventListener('DOMContentLoaded', function () {
    // Waits for the webpage to load before starting
    const API_BASE_URL = '/api/v1/admin'; // Where we get user data from

    async function fetchUsers() {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found in localStorage');
            // Modal.error('Authentication Error', 'No token found. Redirecting to login...');
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1500);
            return null;
        }

        try {
            // Gets the user list from the server
            const response = await fetch(`${API_BASE_URL}/users`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status == 401) {
                Modal.error('Unauthorized', 'Session expired. Redirecting to login...');
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 1500);
                return null;
            }

            if (!response.ok) throw new Error(`Failed to fetch users: ${response.statusText}`);

            const data = await response.json();
            console.log('API Response:', data); // Log full response for debugging

            // Extract the user array from data.data.users
            let usersArray = [];
            if (data.data && Array.isArray(data.data.users)) {
                usersArray = data.data.users; // Access data.data.users
            } else if (Array.isArray(data)) {
                usersArray = data; // Direct array fallback
            } else if (Array.isArray(data.users)) {
                usersArray = data.users; // Alternative key fallback
            } else if (data.data && typeof data.data === 'object') {
                usersArray = [data.data]; // Single user object fallback
            } else {
                throw new Error('Unexpected response format: No valid user array found');
            }

            console.log('Users Array:', usersArray); // Log extracted users

            const formattedData = {};
            usersArray.forEach(user => {
                // Adds each user to the object with their ID
                const userId = user.id || Object.keys(formattedData).length + 1;
                formattedData[userId] = user;
            });

            console.log('Formatted Data:', formattedData);
            return formattedData;
        } catch (error) {
            console.error('Error fetching users:', error);
            Modal.error('Network Error', `Failed to fetch users: ${error.message}`);
            return null;
        }
    }

    async function updateUserTable() {
        // Gets new users and updates the table
        const users = await fetchUsers();
        if (users) {
            // Mixes old and new users
            window.usersData = { ...window.usersData, ...users };
            console.log('Updated usersData:', window.usersData);
            // Updates the table with the new list
            if (typeof window.refreshUserTable === 'function') {
                window.refreshUserTable(window.usersData);
            } else {
                console.error('window.refreshUserTable is not a function');
                Modal.error('Application Error', 'Table refresh function not found.');
            }
        }
    }

    // Initialize window.usersData if not already set
    window.usersData = window.usersData || {};

    // Check for new users every 10 seconds
    setInterval(updateUserTable, 500000);
    // Run immediately on page load
    updateUserTable();
});