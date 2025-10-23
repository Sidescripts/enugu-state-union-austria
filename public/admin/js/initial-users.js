        // document.addEventListener('DOMContentLoaded', function() {
        //     // DOM Elements
        //     const menuToggle = document.getElementById('menuToggle');
        //     const sidebar = document.getElementById('sidebar');
        //     const sidebarOverlay = document.getElementById('sidebarOverlay');
            
        //     // Modal Elements
        //     const viewUserModal = document.getElementById('viewUserModal');
        //     const closeViewModal = document.getElementById('closeViewModal');
        //     const closeView = document.getElementById('closeView');
        //     const editFromView = document.getElementById('editFromView');
            
        //     const editUserModal = document.getElementById('editUserModal');
        //     const closeEditModal = document.getElementById('closeEditModal');
        //     const cancelEdit = document.getElementById('cancelEdit');
        //     const saveUserChanges = document.getElementById('saveUserChanges');
        //     const suspendUser = document.getElementById('suspendUser');
            
        //     const confirmationModal = document.getElementById('confirmationModal');
        //     const closeConfirmationModal = document.getElementById('closeConfirmationModal');
        //     const cancelAction = document.getElementById('cancelAction');
        //     const confirmAction = document.getElementById('confirmAction');
        //     const confirmationTitle = document.getElementById('confirmationTitle');
        //     const confirmationMessage = document.getElementById('confirmationMessage');
            
        //     // Sample user data (in a real app, this would come from a server)
        //     const usersData = {
        //         1: {
        //             id: "#USR-001",
        //             name: "John Doe",
        //             email: "john@example.com",
        //             joined: "2023-05-15",
        //             status: "verified",
        //             balance: "1250.00",
        //             phone: "+1 (555) 123-4567",
        //             country: "United States",
        //             plan: "Premium Plan",
        //             lastLogin: "2023-10-15 14:30"
        //         },
        //         2: {
        //             id: "#USR-002",
        //             name: "Jane Smith",
        //             email: "jane@example.com",
        //             joined: "2023-06-20",
        //             status: "unverified",
        //             balance: "850.00",
        //             phone: "+1 (555) 987-6543",
        //             country: "Canada",
        //             plan: "Basic Plan",
        //             lastLogin: "2023-10-14 09:15"
        //         },
        //         3: {
        //             id: "#USR-003",
        //             name: "Robert Johnson",
        //             email: "robert@example.com",
        //             joined: "2023-07-10",
        //             status: "verified",
        //             balance: "3450.00",
        //             phone: "+44 20 1234 5678",
        //             country: "United Kingdom",
        //             plan: "VIP Plan",
        //             lastLogin: "2023-10-15 16:45"
        //         }
        //     };
            
        //     // Mobile sidebar toggle
        //     menuToggle.addEventListener('click', () => {
        //         sidebar.classList.toggle('active');
        //         sidebarOverlay.classList.toggle('active');
        //     });
            
        //     sidebarOverlay.addEventListener('click', () => {
        //         sidebar.classList.remove('active');
        //         sidebarOverlay.classList.remove('active');
        //     });
            
        //     // View user functionality
        //     document.querySelectorAll('.view-user-btn').forEach(btn => {
        //         btn.addEventListener('click', function() {
        //             const userId = this.getAttribute('data-user-id');
        //             const user = usersData[userId];
                    
        //             if (user) {
        //                 // Populate view modal with user data
        //                 document.getElementById('viewUserId').textContent = user.id;
        //                 document.getElementById('viewUserName').textContent = user.name;
        //                 document.getElementById('viewUserEmail').textContent = user.email;
        //                 document.getElementById('viewUserJoined').textContent = user.joined;
        //                 document.getElementById('viewUserBalance').textContent = '$' + user.balance;
        //                 document.getElementById('viewUserPhone').textContent = user.phone;
        //                 document.getElementById('viewUserCountry').textContent = user.country;
        //                 document.getElementById('viewUserPlan').textContent = user.plan;
        //                 document.getElementById('viewUserLastLogin').textContent = user.lastLogin;
                        
        //                 // Set status badge
        //                 const statusBadge = document.getElementById('viewUserStatus');
        //                 statusBadge.textContent = user.status.charAt(0).toUpperCase() + user.status.slice(1);
        //                 statusBadge.className = 'badge ' + (
        //                     user.status === 'verified' ? 'badge-approved' : 
        //                     user.status === 'unverified' ? 'badge-pending' : 'badge-rejected'
        //                 );
                        
        //                 // Set data attribute for edit button
        //                 editFromView.setAttribute('data-user-id', userId);
                        
        //                 // Show the view modal
        //                 viewUserModal.classList.add('active');
        //             }
        //         });
        //     });
            
        //     // Close view modal
        //     closeViewModal.addEventListener('click', () => {
        //         viewUserModal.classList.remove('active');
        //     });
            
        //     closeView.addEventListener('click', () => {
        //         viewUserModal.classList.remove('active');
        //     });
            
        //     // Edit from view modal
        //     editFromView.addEventListener('click', function() {
        //         const userId = this.getAttribute('data-user-id');
        //         viewUserModal.classList.remove('active');
        //         openEditModal(userId);
        //     });
            
        //     // Edit user functionality
        //     document.querySelectorAll('.edit-user-btn').forEach(btn => {
        //         btn.addEventListener('click', function() {
        //             const userId = this.getAttribute('data-user-id');
        //             openEditModal(userId);
        //         });
        //     });
            
        //     function openEditModal(userId) {
        //         const user = usersData[userId];
                
        //         if (user) {
        //             // Populate edit form with user data
        //             document.getElementById('editUserId').value = userId;
        //             document.getElementById('editUserName').value = user.name;
        //             document.getElementById('editUserEmail').value = user.email;
        //             document.getElementById('editUserPhone').value = user.phone;
        //             document.getElementById('editUserBalance').value = user.balance;
        //             document.getElementById('editUserStatus').value = user.status;
        //             document.getElementById('editUserPlan').value = user.plan.toLowerCase().replace(' plan', '');
        //             document.getElementById('editUserCountry').value = user.country;
                    
        //             // Show the edit modal
        //             editUserModal.classList.add('active');
        //         }
        //     }
            
        //     // Close edit modal
        //     closeEditModal.addEventListener('click', () => {
        //         editUserModal.classList.remove('active');
        //     });
            
        //     cancelEdit.addEventListener('click', () => {
        //         editUserModal.classList.remove('active');
        //     });
            
        //     // Save user changes
        //     saveUserChanges.addEventListener('click', () => {
        //         const userId = document.getElementById('editUserId').value;
        //         const userName = document.getElementById('editUserName').value;
        //         const userEmail = document.getElementById('editUserEmail').value;
        //         const userPhone = document.getElementById('editUserPhone').value;
        //         const userBalance = document.getElementById('editUserBalance').value;
        //         const userStatus = document.getElementById('editUserStatus').value;
        //         const userPlan = document.getElementById('editUserPlan').value;
        //         const userCountry = document.getElementById('editUserCountry').value;
                
        //         if (!userName || !userEmail || !userBalance) {
        //             showConfirmation('Error', 'Please fill all required fields');
        //             return;
        //         }
                
        //         // Update the user data (in a real app, this would be an API call)
        //         usersData[userId] = {
        //             ...usersData[userId],
        //             name: userName,
        //             email: userEmail,
        //             phone: userPhone,
        //             balance: userBalance,
        //             status: userStatus,
        //             plan: userPlan ? userPlan.charAt(0).toUpperCase() + userPlan.slice(1) + ' Plan' : 'No Plan',
        //             country: userCountry
        //         };
                
        //         // Update the table row
        //         const row = document.querySelector(`tr[data-user-id="${userId}"]`);
        //         if (row) {
        //             row.cells[1].textContent = userName;
        //             row.cells[2].textContent = userEmail;
        //             row.cells[4].innerHTML = `<span class="badge ${userStatus === 'verified' ? 'badge-approved' : userStatus === 'unverified' ? 'badge-pending' : 'badge-rejected'}">${userStatus.charAt(0).toUpperCase() + userStatus.slice(1)}</span>`;
        //             row.cells[5].textContent = '$' + userBalance;
        //         }
                
        //         // Close the modal and show success message
        //         editUserModal.classList.remove('active');
        //         showConfirmation('Success', 'User details updated successfully!');
        //     });
            
        //     // Suspend user
        //     suspendUser.addEventListener('click', function() {
        //         const userId = document.getElementById('editUserId').value;
        //         const userName = document.getElementById('editUserName').value;
                
        //         showConfirmation(
        //             'Suspend User', 
        //             `Are you sure you want to suspend ${userName}? This will restrict their account access.`,
        //             () => {
        //                 // Update user status to banned
        //                 usersData[userId].status = 'banned';
                        
        //                 // Update the table
        //                 const row = document.querySelector(`tr[data-user-id="${userId}"]`);
        //                 if (row) {
        //                     const statusCell = row.cells[4];
        //                     statusCell.innerHTML = '<span class="badge badge-rejected">Banned</span>';
        //                 }
                        
        //                 // Close modals
        //                 editUserModal.classList.remove('active');
        //                 showConfirmation('Success', `${userName} has been suspended.`);
        //             }
        //         );
        //     });
            
        //     // Confirmation modal function
        //     function showConfirmation(title, message, confirmCallback) {
        //         confirmationTitle.textContent = title;
        //         confirmationMessage.textContent = message;
        //         confirmationModal.classList.add('active');
                
        //         // Set up confirm action
        //         confirmAction.onclick = () => {
        //             confirmationModal.classList.remove('active');
        //             if (confirmCallback) confirmCallback();
        //         };
                
        //         // Set up cancel action
        //         cancelAction.onclick = () => {
        //             confirmationModal.classList.remove('active');
        //         };
        //     }
            
        //     // Close confirmation modal
        //     closeConfirmationModal.addEventListener('click', () => {
        //         confirmationModal.classList.remove('active');
        //     });
        // });