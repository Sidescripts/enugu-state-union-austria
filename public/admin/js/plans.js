// // investment-plans.js
// document.addEventListener('DOMContentLoaded', function() {
//     const addPlanBtn = document.getElementById('addPlanBtn');
//     const addPlanForm = document.getElementById('add-plan-form');
//     const plansList = document.getElementById('plans-list');
//     const cancelAddPlan = document.getElementById('cancelAddPlan');
    
//     // Investment plan form toggle
//     if (addPlanBtn && addPlanForm && plansList && cancelAddPlan) {
//         addPlanBtn.addEventListener('click', () => {
//             plansList.style.display = 'none';
//             addPlanForm.style.display = 'block';
//         });
        
//         cancelAddPlan.addEventListener('click', () => {
//             addPlanForm.style.display = 'none';
//             plansList.style.display = 'block';
//         });
//     }
// });

   document.addEventListener('DOMContentLoaded', function() {
            // DOM Elements
            const menuToggle = document.getElementById('menuToggle');
            const sidebar = document.getElementById('sidebar');
            const sidebarOverlay = document.getElementById('sidebarOverlay');
            const addPlanBtn = document.getElementById('addPlanBtn');
            const addPlanForm = document.getElementById('add-plan-form');
            const plansList = document.getElementById('plans-list');
            const cancelAddPlan = document.getElementById('cancelAddPlan');
            const saveNewPlan = document.getElementById('saveNewPlan');
            
            // Modal Elements
            const editPlanModal = document.getElementById('editPlanModal');
            const closeEditModal = document.getElementById('closeEditModal');
            const cancelEditPlan = document.getElementById('cancelEditPlan');
            const saveEditPlan = document.getElementById('saveEditPlan');
            
            const confirmationModal = document.getElementById('confirmationModal');
            const closeConfirmationModal = document.getElementById('closeConfirmationModal');
            const cancelAction = document.getElementById('cancelAction');
            const confirmAction = document.getElementById('confirmAction');
            const confirmationTitle = document.getElementById('confirmationTitle');
            const confirmationMessage = document.getElementById('confirmationMessage');
            
            const messageModal = document.getElementById('messageModal');
            const closeMessageModal = document.getElementById('closeMessageModal');
            const closeMessage = document.getElementById('closeMessage');
            const messageTitle = document.getElementById('messageTitle');
            const messageText = document.getElementById('messageText');
            
            // Sample plan data (in a real app, this would come from a server)
            const plansData = {
                1: {
                    name: "Starter Plan",
                    returnRate: 15,
                    duration: 6,
                    minDeposit: 100,
                    maxDeposit: 1000,
                    status: "active",
                    description: "Perfect for beginners with low investment threshold"
                },
                2: {
                    name: "Premium Plan",
                    returnRate: 25,
                    duration: 12,
                    minDeposit: 1000,
                    maxDeposit: 10000,
                    status: "active",
                    description: "For experienced investors looking for higher returns"
                },
                3: {
                    name: "VIP Plan",
                    returnRate: 35,
                    duration: 24,
                    minDeposit: 10000,
                    maxDeposit: 100000,
                    status: "active",
                    description: "Exclusive plan for high-net-worth individuals"
                }
            };
            
            // Mobile sidebar toggle
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
                sidebarOverlay.classList.toggle('active');
            });
            
            sidebarOverlay.addEventListener('click', () => {
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
            });
            
            // Investment plan form toggle
            addPlanBtn.addEventListener('click', () => {
                plansList.style.display = 'none';
                addPlanForm.style.display = 'block';
            });
            
            cancelAddPlan.addEventListener('click', () => {
                addPlanForm.style.display = 'none';
                plansList.style.display = 'block';
            });
            
            // Save new plan
            saveNewPlan.addEventListener('click', () => {
                const planName = document.getElementById('planName').value;
                const returnRate = document.getElementById('returnRate').value;
                const duration = document.getElementById('duration').value;
                const minDeposit = document.getElementById('minDeposit').value;
                const maxDeposit = document.getElementById('maxDeposit').value;
                const planStatus = document.getElementById('planStatus').value;
                
                if (!planName || !returnRate || !duration || !minDeposit || !maxDeposit) {
                    showMessage('Error', 'Please fill all required fields');
                    return;
                }
                
                // In a real application, you would send this data to the server
                showMessage('Success', 'New plan added successfully!');
                
                // Reset form and show plans list
                document.getElementById('planName').value = '';
                document.getElementById('returnRate').value = '';
                document.getElementById('duration').value = '';
                document.getElementById('minDeposit').value = '';
                document.getElementById('maxDeposit').value = '';
                document.getElementById('planStatus').value = 'active';
                document.getElementById('planDescription').value = '';
                
                addPlanForm.style.display = 'none';
                plansList.style.display = 'block';
            });
            
            // Edit plan functionality
            document.querySelectorAll('.edit-plan-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const planId = this.getAttribute('data-plan-id');
                    const plan = plansData[planId];
                    
                    if (plan) {
                        // Fill the edit form with plan data
                        document.getElementById('editPlanId').value = planId;
                        document.getElementById('editPlanName').value = plan.name;
                        document.getElementById('editReturnRate').value = plan.returnRate;
                        document.getElementById('editDuration').value = plan.duration;
                        document.getElementById('editMinDeposit').value = plan.minDeposit;
                        document.getElementById('editMaxDeposit').value = plan.maxDeposit;
                        document.getElementById('editPlanStatus').value = plan.status;
                        document.getElementById('editPlanDescription').value = plan.description || '';
                        
                        // Show the edit modal
                        editPlanModal.classList.add('active');
                    }
                });
            });
            
            // Close edit modal
            closeEditModal.addEventListener('click', () => {
                editPlanModal.classList.remove('active');
            });
            
            cancelEditPlan.addEventListener('click', () => {
                editPlanModal.classList.remove('active');
            });
            
            // Save edited plan
            saveEditPlan.addEventListener('click', () => {
                const planId = document.getElementById('editPlanId').value;
                const planName = document.getElementById('editPlanName').value;
                const returnRate = document.getElementById('editReturnRate').value;
                const duration = document.getElementById('editDuration').value;
                const minDeposit = document.getElementById('editMinDeposit').value;
                const maxDeposit = document.getElementById('editMaxDeposit').value;
                const planStatus = document.getElementById('editPlanStatus').value;
                
                if (!planName || !returnRate || !duration || !minDeposit || !maxDeposit) {
                    showMessage('Error', 'Please fill all required fields');
                    return;
                }
                
                // Update the plan data (in a real app, this would be an API call)
                plansData[planId] = {
                    ...plansData[planId],
                    name: planName,
                    returnRate: returnRate,
                    duration: duration,
                    minDeposit: minDeposit,
                    maxDeposit: maxDeposit,
                    status: planStatus
                };
                
                // Update the table row
                const row = document.querySelector(`tr[data-plan-id="${planId}"]`);
                if (row) {
                    row.cells[0].textContent = planName;
                    row.cells[1].textContent = returnRate + '% monthly';
                    row.cells[2].textContent = duration + ' months';
                    row.cells[3].textContent = '$' + minDeposit;
                    row.cells[4].textContent = '$' + maxDeposit;
                    
                    // Update status badge
                    const statusBadge = row.cells[5].querySelector('.badge');
                    statusBadge.className = 'badge ' + (planStatus === 'active' ? 'badge-approved' : 'badge-rejected');
                    statusBadge.textContent = planStatus === 'active' ? 'Active' : 'Inactive';
                }
                
                // Close the modal and show success message
                editPlanModal.classList.remove('active');
                showMessage('Success', 'Plan updated successfully!');
            });
            
            // Disable plan functionality
            document.querySelectorAll('.disable-plan-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const planId = this.getAttribute('data-plan-id');
                    const planName = plansData[planId].name;
                    
                    // Show confirmation modal
                    showConfirmation(
                        'Disable Plan', 
                        `Are you sure you want to disable ${planName}?`,
                        () => {
                            // This function runs when user confirms
                            plansData[planId].status = 'inactive';
                            
                            // Update the table
                            const row = document.querySelector(`tr[data-plan-id="${planId}"]`);
                            if (row) {
                                const statusBadge = row.cells[5].querySelector('.badge');
                                statusBadge.className = 'badge badge-rejected';
                                statusBadge.textContent = 'Inactive';
                            }
                            
                            showMessage('Success', `${planName} has been disabled`);
                        }
                    );
                });
            });
            
            // Confirmation modal functions
            function showConfirmation(title, message, confirmCallback) {
                confirmationTitle.textContent = title;
                confirmationMessage.textContent = message;
                confirmationModal.classList.add('active');
                
                // Set up confirm action
                confirmAction.onclick = () => {
                    confirmationModal.classList.remove('active');
                    if (confirmCallback) confirmCallback();
                };
                
                // Set up cancel action
                cancelAction.onclick = () => {
                    confirmationModal.classList.remove('active');
                };
            }
            
            // Close confirmation modal
            closeConfirmationModal.addEventListener('click', () => {
                confirmationModal.classList.remove('active');
            });
            
            // Message modal functions
            function showMessage(title, text) {
                messageTitle.textContent = title;
                messageText.textContent = text;
                messageModal.classList.add('active');
            }
            
            // Close message modal
            closeMessage.addEventListener('click', () => {
                messageModal.classList.remove('active');
            });
            
            closeMessageModal.addEventListener('click', () => {
                messageModal.classList.remove('active');
            });
        });