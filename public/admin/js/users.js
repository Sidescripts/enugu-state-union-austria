// users.js - Updated with proper balance update functionality
document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    const elements = {
        menuToggle: document.getElementById('menuToggle'),
        sidebar: document.getElementById('sidebar'),
        sidebarOverlay: document.getElementById('sidebarOverlay'),
        viewUserModal: document.getElementById('viewUserModal'),
        closeViewModal: document.getElementById('closeViewModal'),
        closeView: document.getElementById('closeView'),
        editFromView: document.getElementById('editFromView'),
        editUserModal: document.getElementById('editUserModal'),
        closeEditModal: document.getElementById('closeEditModal'),
        cancelEdit: document.getElementById('cancelEdit'),
        saveUserChanges: document.getElementById('saveUserChanges'),
        suspendUser: document.getElementById('suspendUser'),
        confirmationModal: document.getElementById('confirmationModal'),
        closeConfirmationModal: document.getElementById('closeConfirmationModal'),
        cancelAction: document.getElementById('cancelAction'),
        confirmAction: document.getElementById('confirmAction'),
        confirmationTitle: document.getElementById('confirmationTitle'),
        confirmationMessage: document.getElementById('confirmationMessage')
    };

    // Log missing elements
    Object.entries(elements).forEach(([key, element]) => {
        if (!element) console.error(`Element with ID '${key}' not found`);
    });

    // Initialize window.usersData if not set
    window.usersData = window.usersData || {};

    // Mobile sidebar toggle
    if (elements.menuToggle && elements.sidebar && elements.sidebarOverlay) {
        elements.menuToggle.addEventListener('click', () => {
            console.log('Menu toggle clicked');
            elements.sidebar.classList.toggle('active');
            elements.sidebarOverlay.classList.toggle('active');
        });
        elements.sidebarOverlay.addEventListener('click', () => {
            console.log('Sidebar overlay clicked');
            elements.sidebar.classList.remove('active');
            elements.sidebarOverlay.classList.remove('active');
        });
    }

    // Refresh user table function
    window.refreshUserTable = function (usersData) {
        const tbody = document.querySelector('.data-table tbody');
        if (!tbody) {
            console.error('Table body (.data-table tbody) not found');
            alert("Table body not found.")
            // Modal.error('Application Error', 'Table body not found. Please check the HTML.');
            return;
        }

        tbody.innerHTML = '';
        Object.entries(usersData).forEach(([userId, user]) => {
            // Map API fields to table fields
            const normalizedUser = {
                id: user.id || 'N/A',
                name: user.fullname || user.name || 'N/A',
                email: user.email || 'N/A',
                joined: user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : user.joined || 'N/A',
                status: user.isVerified === false ? 'unverified' : user.isVerified === true ? 'verified' : user.status || 'unverified',
                balance: Number(user.walletBalance || user.balance || 0).toFixed(2),
                phone: user.phone || 'N/A',
                country: user.country || 'N/A',
                plan: user.plan || 'No Plan',
                lastLogin: user.lastLogin || 'N/A'
            };

            const actions = normalizedUser.status === 'banned'
                ? `<button class="btn btn-sm btn-primary unsuspend-user-btn" data-user-id="${userId}">Unsuspend</button>`
                : `<button class="btn btn-sm btn-primary view-user-btn" data-user-id="${userId}">View</button>
                   <button class="btn btn-sm btn-secondary edit-user-btn" data-user-id="${userId}">Edit</button>`;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${normalizedUser.id}</td>
                <td>${normalizedUser.name}</td>
                <td>${normalizedUser.email}</td>
                <td>${normalizedUser.joined}</td>
                <td><span class="badge ${normalizedUser.status === 'verified' ? 'badge-approved' : normalizedUser.status === 'unverified' ? 'badge-pending' : 'badge-rejected'}">${normalizedUser.status.charAt(0).toUpperCase() + normalizedUser.status.slice(1)}</span></td>
                <td>$${normalizedUser.balance}</td>
                <td>${actions}</td>
            `;
            tbody.appendChild(row);
        });

        // Reattach event listeners
        document.querySelectorAll('.view-user-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                console.log('View button clicked for user:', this.getAttribute('data-user-id'));
                const userId = this.getAttribute('data-user-id');
                const user = usersData[userId];
                if (user && elements.viewUserModal) {
                    const normalizedUser = {
                        id: user.id || 'N/A',
                        name: user.fullname || user.name || 'N/A',
                        email: user.email || 'N/A',
                        joined: user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : user.joined || 'N/A',
                        status: user.isVerified === false ? 'unverified' : user.isVerified === true ? 'verified' : user.status || 'unverified',
                        balance: Number(user.walletBalance || user.balance || 0).toFixed(2),
                        phone: user.phone || 'N/A',
                        country: user.country || 'N/A',
                        plan: user.plan || 'No Plan',
                        lastLogin: user.lastLogin || 'N/A'
                    };
                    const viewElements = {
                        viewUserId: document.getElementById('viewUserId'),
                        viewUserName: document.getElementById('viewUserName'),
                        viewUserEmail: document.getElementById('viewUserEmail'),
                        viewUserJoined: document.getElementById('viewUserJoined'),
                        viewUserBalance: document.getElementById('viewUserBalance'),
                        viewUserPhone: document.getElementById('viewUserPhone'),
                        viewUserCountry: document.getElementById('viewUserCountry'),
                        viewUserPlan: document.getElementById('viewUserPlan'),
                        viewUserLastLogin: document.getElementById('viewUserLastLogin'),
                        viewUserStatus: document.getElementById('viewUserStatus')
                    };
                    if (Object.values(viewElements).every(el => el)) {
                        viewElements.viewUserId.textContent = normalizedUser.id;
                        viewElements.viewUserName.textContent = normalizedUser.name;
                        viewElements.viewUserEmail.textContent = normalizedUser.email;
                        viewElements.viewUserJoined.textContent = normalizedUser.joined;
                        viewElements.viewUserBalance.textContent = '$' + normalizedUser.balance;
                        viewElements.viewUserPhone.textContent = normalizedUser.phone;
                        viewElements.viewUserCountry.textContent = normalizedUser.country;
                        viewElements.viewUserPlan.textContent = normalizedUser.plan;
                        viewElements.viewUserLastLogin.textContent = normalizedUser.lastLogin;
                        viewElements.viewUserStatus.textContent = normalizedUser.status.charAt(0).toUpperCase() + normalizedUser.status.slice(1);
                        viewElements.viewUserStatus.className = 'badge ' + (
                            normalizedUser.status === 'verified' ? 'badge-approved' :
                            normalizedUser.status === 'unverified' ? 'badge-pending' : 'badge-rejected'
                        );
                        elements.editFromView.setAttribute('data-user-id', userId);
                        elements.viewUserModal.classList.add('active');
                    } else {
                        console.error('View modal elements missing:', viewElements);
                        // Modal.error('Application Error', 'View modal elements not found.');
                    }
                }
            });
        });

        document.querySelectorAll('.edit-user-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                console.log('Edit button clicked for user:', this.getAttribute('data-user-id'));
                const userId = this.getAttribute('data-user-id');
                openEditModal(userId);
            });
        });

        document.querySelectorAll('.unsuspend-user-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                console.log('Unsuspend button clicked for user:', this.getAttribute('data-user-id'));
                const userId = this.getAttribute('data-user-id');
                showConfirmation('Unsuspend User', 'Are you sure you want to unsuspend this user?', () => {
                    updateUserStatus(userId, 'verified');
                });
            });
        });
    };

    // Initial population
    if (Object.keys(window.usersData).length > 0) {
        window.refreshUserTable(window.usersData);
    } else {
        console.log('No initial user data, waiting for userSync.js');
    }

    // View user functionality
    if (elements.closeViewModal) {
        elements.closeViewModal.addEventListener('click', () => {
            console.log('Close view modal clicked');
            elements.viewUserModal.classList.remove('active');
        });
    }
    
    if (elements.closeView) {
        elements.closeView.addEventListener('click', () => {
            console.log('Close view button clicked');
            elements.viewUserModal.classList.remove('active');
        });
    }
    
    if (elements.editFromView) {
        elements.editFromView.addEventListener('click', function () {
            console.log('Edit from view clicked for user:', this.getAttribute('data-user-id'));
            const userId = this.getAttribute('data-user-id');
            elements.viewUserModal.classList.remove('active');
            openEditModal(userId);
        });
    }

    function openEditModal(userId) {
        const user = window.usersData[userId];
        if (user && elements.editUserModal) {
            const normalizedUser = {
                name: user.fullname || user.name || 'N/A',
                email: user.email || 'N/A',
                phone: user.phone || '',
                balance: Number(user.walletBalance || user.balance || 0).toFixed(2),
                status: user.isVerified === false ? 'unverified' : user.isVerified === true ? 'verified' : user.status || 'unverified',
                plan: user.plan ? user.plan.toLowerCase().replace(' plan', '') : '',
                country: user.country || ''
            };
            const editElements = {
                editUserId: document.getElementById('editUserId'),
                editUserName: document.getElementById('editUserName'),
                editUserEmail: document.getElementById('editUserEmail'),
                editUserPhone: document.getElementById('editUserPhone'),
                editUserBalance: document.getElementById('editUserBalance'),
                editUserStatus: document.getElementById('editUserStatus'),
                editUserPlan: document.getElementById('editUserPlan'),
                editUserCountry: document.getElementById('editUserCountry')
            };
            if (Object.values(editElements).every(el => el)) {
                editElements.editUserId.value = userId;
                editElements.editUserName.value = normalizedUser.name;
                editElements.editUserEmail.value = normalizedUser.email;
                editElements.editUserPhone.value = normalizedUser.phone;
                editElements.editUserBalance.value = normalizedUser.balance;
                editElements.editUserStatus.value = normalizedUser.status;
                editElements.editUserPlan.value = normalizedUser.plan;
                editElements.editUserCountry.value = normalizedUser.country;
                
                // Make all fields except balance read-only
                editElements.editUserName.setAttribute('readonly', true);
                editElements.editUserEmail.setAttribute('readonly', true);
                editElements.editUserPhone.setAttribute('readonly', true);
                editElements.editUserStatus.setAttribute('disabled', true);
                editElements.editUserPlan.setAttribute('disabled', true);
                editElements.editUserCountry.setAttribute('readonly', true);
                
                elements.editUserModal.classList.add('active');
            } else {
                console.error('Edit modal elements missing:', editElements);
                Modal.error('Application Error', 'Edit modal elements not found.');
            }
        }
    }

    if (elements.closeEditModal) {
        elements.closeEditModal.addEventListener('click', () => {
            console.log('Close edit modal clicked');
            elements.editUserModal.classList.remove('active');
        });
    }

    if (elements.cancelEdit) {
        elements.cancelEdit.addEventListener('click', () => {
            console.log('Cancel edit clicked');
            elements.editUserModal.classList.remove('active');
        });
    }

    if (elements.saveUserChanges) {
        elements.saveUserChanges.addEventListener('click', async () => {
            console.log('Save user changes clicked');
            const editElements = {
                editUserId: document.getElementById('editUserId'),
                editUserBalance: document.getElementById('editUserBalance')
            };
            
            if (!Object.values(editElements).every(el => el)) {
                console.error('Edit modal elements missing:', editElements);
                // Modal.error('Application Error', 'Edit modal elements not found.');
                return;
            }

            const userId = editElements.editUserId.value;
            const userBalance = parseFloat(editElements.editUserBalance.value);

            if (isNaN(userBalance) || userBalance < 0) {
                showConfirmation('Error', 'Please enter a valid balance amount');
                return;
            }

            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    // Modal.error('Authentication Error', 'No token found. Redirecting to login...');
                    setTimeout(() => {
                        window.location.href = '../index.html';
                    }, 1500);
                    return;
                }

                // Update balance using your API endpoint
                const action = "add";
                const response = await fetch(`/api/v1/admin/users/${userId}/balance`, {
                    method: 'PATCH',
                    headers: { 
                        'Content-Type': 'application/json', 
                        'Authorization': `Bearer ${token}` 
                    },
                    body: JSON.stringify({ amount: userBalance, action: action })
                });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || 'Failed to update balance');
                }

                // Update local data
                if (window.usersData[userId]) {
                    window.usersData[userId].balance = userBalance;
                    window.usersData[userId].walletBalance = userBalance;
                }
                
                // Refresh the table
                window.refreshUserTable(window.usersData);
                
                // Close the modal
                elements.editUserModal.classList.remove('active');
                
                // Show success message
                showConfirmation('Success', 'User balance updated successfully!');
            } catch (error) {
                console.error('Update error:', error);
                showConfirmation('Error', `Failed to update user balance: ${error.message}`);
            }
        });
    }

    if (elements.suspendUser) {
        elements.suspendUser.addEventListener('click', function () {
            console.log('Suspend user clicked');
            const userId = document.getElementById('editUserId').value;
            const userName = document.getElementById('editUserName').value;
            showConfirmation(
                'Suspend User',
                `Are you sure you want to suspend ${userName}? This will restrict their account access.`,
                () => {
                    updateUserStatus(userId, 'banned');
                }
            );
        });
    }

    async function updateUserStatus(userId, status) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                Modal.error('Authentication Error', 'No token found. Redirecting to login...');
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 1500);
                return;
            }

            const response = await fetch(`/api/v1/admin/users/${userId}/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ isVerified: status === 'verified' ? true : false })
            });
            if (!response.ok) throw new Error('Failed to update status');
            const updatedUser = await response.json();
            window.usersData[userId] = {
                ...window.usersData[userId],
                isVerified: updatedUser.isVerified === true || updatedUser.isVerified,
                // status: updatedUser.status || (updatedUser.isVerified ? 'verified' : 'unverified')
            };
            window.refreshUserTable(window.usersData);
            elements.editUserModal.classList.remove('active');
            showConfirmation('Success', `${window.usersData[userId].fullname || window.usersData[userId].name} has been ${status === 'banned' ? 'suspended' : 'unsuspended'}.`);
        } catch (error) {
            console.error('Status update error:', error);
            showConfirmation('Error', `Failed to update user status: ${error.message}`);
        }
    }

    function showConfirmation(title, message, confirmCallback) {
        if (elements.confirmationTitle && elements.confirmationMessage && elements.confirmationModal) {
            elements.confirmationTitle.textContent = title;
            elements.confirmationMessage.textContent = message;
            elements.confirmationModal.classList.add('active');
            elements.confirmAction.onclick = () => {
                console.log('Confirm action clicked');
                elements.confirmationModal.classList.remove('active');
                if (confirmCallback) confirmCallback();
            };
            elements.cancelAction.onclick = () => {
                console.log('Cancel action clicked');
                elements.confirmationModal.classList.remove('active');
            };
        } else {
            console.error('Confirmation modal elements missing');
            Modal.error('Application Error', 'Confirmation modal elements not found.');
        }
    }

    if (elements.closeConfirmationModal) {
        elements.closeConfirmationModal.addEventListener('click', () => {
            console.log('Close confirmation modal clicked');
            elements.confirmationModal.classList.remove('active');
        });
    }
});