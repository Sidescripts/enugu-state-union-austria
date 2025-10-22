// deepseek

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
  const plansTableBody = document.getElementById('plans-table-body');
  
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
  
  // Global variables
  let currentPlanId = null;
  let currentAction = null;
  let plansData = {};
  
  // Initialize
  fetchPlans();
  
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
      resetAddForm();
  });
  
  // Save new plan
  saveNewPlan.addEventListener('click', createNewPlan);
  
  // Close edit modal
  closeEditModal.addEventListener('click', closeEditModalFunc);
  cancelEditPlan.addEventListener('click', closeEditModalFunc);
  
  // Save edited plan
  saveEditPlan.addEventListener('click', updatePlan);
  
  // Close confirmation modal
  closeConfirmationModal.addEventListener('click', closeConfirmationModalFunc);
  cancelAction.addEventListener('click', closeConfirmationModalFunc);
  
  // Close message modal
  closeMessage.addEventListener('click', closeMessageModalFunc);
  closeMessageModal.addEventListener('click', closeMessageModalFunc);
  
  // Confirm action
  confirmAction.addEventListener('click', handleConfirmedAction);
  
  // Fetch all investment plans
  async function fetchPlans() {
      try {
          const token = localStorage.getItem('token');
          if (!token) {
              showMessage('Error', 'Authentication token not found. Please login again.');
              return;
          }
          
          const response = await fetch('/api/v1/admin/invest/all', {
              method: 'GET',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              }
          });
          
          if (response.status === 401) {
              setTimeout(() => {
                  window.location.href = "../index.html";
              }, 2000);
              throw new Error('Session expired. Please login again.');
          }
          
          if (!response.ok) {
              throw new Error(`Failed to fetch plans: ${response.status}`);
          }
          
          const responseData = await response.json();
          plansData = responseData.data || {};
          renderPlansTable(plansData);
          
      } catch (error) {
          console.error('Error fetching plans:', error);
          showMessage('Error', 'Failed to load investment plans: ' + error.message);
      }
  }
  
  // Render plans table
  function renderPlansTable(plans) {
      plansTableBody.innerHTML = '';
      
      if (!plans || plans.length === 0) {
          plansTableBody.innerHTML = `
              <tr>
                  <td colspan="7" style="text-align: center; padding: 20px;">
                      No investment plans found. Click "Add New Plan" to create one.
                  </td>
              </tr>
          `;
          return;
      }
      
      plans.forEach(plan => {
          const row = document.createElement('tr');
          row.setAttribute('data-plan-id', plan.id);
          
          row.innerHTML = `
              <td>${plan.name || 'N/A'}</td>
              <td>${plan.roi_percentage || '0'}%</td>
              <td>${plan.duration_days || '0'}</td>
              <td>$${Number( plan.min_amount).toFixed(3) || '0'}</td>
              <td>$${Number(plan.max_amount).toFixed(3) || '0'}</td>
              <td>
                  <span class="badge ${plan.is_active == true ? 'badge-approved' : 'badge-rejected'}">
                      ${plan.is_active == true ? 'Active' : 'Inactive'}
                  </span>
              </td>
              <td>
                  <button class="btn btn-sm btn-primary edit-plan-btn" data-plan-id="${plan.id}">Edit</button>
                  <button class="btn btn-sm ${plan.is_active == true ? 'btn-danger' : 'btn-success'} toggle-plan-btn" data-plan-id="${plan.id}">
                      ${plan.is_active == true ? 'Deactivate' : 'Activate'}
                  </button>
                  <button class="btn btn-sm btn-danger delete-plan-btn" data-plan-id="${plan.id}">Delete</button>
              </td>
          `;
          
          plansTableBody.appendChild(row);
      });
      
      // Attach event listeners to action buttons
      attachPlanActionListeners();
  }
  
  // Attach event listeners to plan action buttons
  function attachPlanActionListeners() {
      // Edit plan buttons
      document.querySelectorAll('.edit-plan-btn').forEach(btn => {
          btn.addEventListener('click', function() {
              const planId = this.getAttribute('data-plan-id');
              openEditPlanModal(planId);
          });
      });
      
      // Toggle plan status buttons
      document.querySelectorAll('.toggle-plan-btn').forEach(btn => {
          btn.addEventListener('click', function() {
              const planId = this.getAttribute('data-plan-id');
              const plan = plansData.find(p => p.id === planId);
              
              if (plan) {
                  const action = plan.is_active == true ? 'deactivate' : 'activate';
                  showConfirmation(
                      `${action === 'deactivate' ? 'Deactivate' : 'Activate'} Plan`,
                      `Are you sure you want to ${action} the plan "${plan.name}"?`,
                      action,
                      planId
                  );
              }
          });
      });
      
      // Delete plan buttons
      document.querySelectorAll('.delete-plan-btn').forEach(btn => {
          btn.addEventListener('click', function() {
              const planId = this.getAttribute('data-plan-id');
              const plan = plansData.find(p => p.id === planId);
              
              if (plan) {
                  showConfirmation(
                      'Delete Plan',
                      `Are you sure you want to delete the plan "${plan.name}"? This action cannot be undone.`,
                      'delete',
                      planId
                  );
              }
          });
      });
  }
  
  // Open edit plan modal
  function openEditPlanModal(planId) {
      const plan = plansData.find(p => p.id === planId);
      
      if (plan) {
          currentPlanId = planId;
          
          // Fill the edit form with plan data
          document.getElementById('editPlanId').value = planId;
          document.getElementById('editPlanName').value = plan.name || '';
          document.getElementById('editReturnRate').value = plan.roi_percentage || '';
          document.getElementById('editDuration').value = plan.duration_days || '';
          document.getElementById('editMinDeposit').value = plan.min_amount || '';
          document.getElementById('editMaxDeposit').value = plan.max_amount || '';
          document.getElementById('editPlanStatus').value = plan.is_active || 'active';
          document.getElementById('editPlanDescription').value = plan.description || '';
          
          // Show the edit modal
          editPlanModal.classList.add('active');
      }
  }
  
  // Close edit modal
  function closeEditModalFunc() {
      editPlanModal.classList.remove('active');
      currentPlanId = null;
  }
  
  // Create new plan
  async function createNewPlan() {
      const planName = document.getElementById('planName').value;
      const returnRate = document.getElementById('returnRate').value;
      const duration = document.getElementById('duration').value;
      const minDeposit = document.getElementById('minDeposit').value;
      const maxDeposit = document.getElementById('maxDeposit').value;
      // const planStatus = document.getElementById('planStatus').value;
      const planDescription = document.getElementById('planDescription').value;
      
      if (!planName || !returnRate || !duration || !minDeposit || !maxDeposit) {
          showMessage('Error', 'Please fill all required fields');
          return;
      }
      console.log({
        name: planName,
        returnRate,
        duration,
        minDeposit,
        maxDeposit,
        planDescription
      })
      if (parseFloat(minDeposit) >= parseFloat(maxDeposit)) {
          showMessage('Error', 'Maximum deposit must be greater than minimum deposit');
          return;
      }
      
      try {
          const token = localStorage.getItem('token');
          if (!token) {
              showMessage('Error', 'Authentication token not found. Please login again.');
              return;
          }
          
          const response = await fetch('/api/v1/admin/invest/create-plan', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                  name: planName,
                  roi_percentage : parseFloat(returnRate),
                  duration_days: parseInt(duration),
                  min_amount: parseFloat(minDeposit),
                  max_amount: parseFloat(maxDeposit),
                  description: planDescription
              })
          });
          
          if (response.status === 401) {
              setTimeout(() => {
                  window.location.href = "../index.html";
              }, 2000);
              throw new Error('Session expired. Please login again.');
          }
          
          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || `Failed to create plan: ${response.status}`);
          }
          
          const result = await response.json();
          console.log(result)
          showMessage('Success', 'Plan created successfully!');
          
          // Reset form and show plans list
          resetAddForm();
          addPlanForm.style.display = 'none';
          plansList.style.display = 'block';
          
          // Refresh the plans list
          fetchPlans();
          
      } catch (error) {
          console.error('Error creating plan:', error);
          showMessage('Error', 'Failed to create plan: ' + error.message);
      }
  }
  
  // Update plan
  async function updatePlan() {
      const planId = document.getElementById('editPlanId').value;
      const planName = document.getElementById('editPlanName').value;
      const returnRate = document.getElementById('editReturnRate').value;
      const duration = document.getElementById('editDuration').value;
      const minDeposit = document.getElementById('editMinDeposit').value;
      const maxDeposit = document.getElementById('editMaxDeposit').value;
      const planStatus = document.getElementById('editPlanStatus').value;
      const planDescription = document.getElementById('editPlanDescription').value;
      
      if (!planName || !returnRate || !duration || !minDeposit || !maxDeposit) {
          showMessage('Error', 'Please fill all required fields');
          return;
      }
      
      if (parseFloat(minDeposit) >= parseFloat(maxDeposit)) {
          showMessage('Error', 'Maximum deposit must be greater than minimum deposit');
          return;
      }
      console.log(planName , returnRate , duration , minDeposit , maxDeposit)
      try {
          const token = localStorage.getItem('token');
          if (!token) {
              showMessage('Error', 'Authentication token not found. Please login again.');
              return;
          }
          
          const response = await fetch(`/api/v1/admin/invest/update/${planId}`, {
              method: 'PATCH',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                  name: planName,
                  roi_percentage: parseFloat(returnRate),
                  duration_days: parseInt(duration),
                  min_amount: parseFloat(minDeposit),
                  max_amount: parseFloat(maxDeposit),
                  description: planDescription
              })
          });
          
          if (response.status === 401) {
              setTimeout(() => {
                  window.location.href = "../index.html";
              }, 2000);
              throw new Error('Session expired. Please login again.');
          }
          
          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || `Failed to update plan: ${response.status}`);
          }
          
          // Close the modal and show success message
          closeEditModalFunc();
          showMessage('Success', 'Plan updated successfully!');
          
          // Refresh the plans list
          fetchPlans();
          
      } catch (error) {
          console.error('Error updating plan:', error);
          showMessage('Error', error.message);
      }
  }
  
  // Toggle plan status (activate/deactivate)
  async function togglePlanStatus(planId, action) {
      try {
          const token = localStorage.getItem('token');
          if (!token) {
              showMessage('Error', 'Authentication token not found. Please login again.');
              return;
          }
          
          const endpoint = action === 'deactivate' ? 
              `/api/v1/admin/invest/deactivate/${planId}` : 
              `/api/v1/admin/invest/update/${planId}`;
          
          const body = action === 'deactivate' ? 
              { is_active: false } : 
              { is_active: true };
          
          const response = await fetch(endpoint, {
              method: 'PATCH',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(body)
          });
          
          if (response.status === 401) {
              setTimeout(() => {
                  window.location.href = "../index.html";
              }, 2000);
              throw new Error('Session expired. Please login again.');
          }
          
          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || `Failed to ${action} plan: ${response.status}`);
          }
          
          showMessage('Success', `Plan ${action}d successfully!`);
          
          // Refresh the plans list
          fetchPlans();
          
      } catch (error) {
          console.error(`Error ${action}ing plan:`, error);
          showMessage('Error', `Failed to ${action} plan: ` + error.message);
      }
  }
  
  // Delete plan
  async function deletePlan(planId) {
      try {
          const token = localStorage.getItem('token');
          if (!token) {
              showMessage('Error', 'Authentication token not found. Please login again.');
              return;
          }
          
          const response = await fetch(`/api/v1/admin/invest/delete/${planId}`, {
              method: 'DELETE',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              }
          });
          
          if (response.status === 401) {
              setTimeout(() => {
                  window.location.href = "../index.html";
              }, 2000);
              throw new Error('Session expired. Please login again.');
          }
          
          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || `Failed to delete plan: ${response.status}`);
          }
          
          showMessage('Success', 'Plan deleted successfully!');
          
          // Refresh the plans list
          fetchPlans();
          
      } catch (error) {
          console.error('Error deleting plan:', error);
          showMessage('Error', 'Failed to delete plan: ' + error.message);
      }
  }
  
  // Show confirmation modal
  function showConfirmation(title, message, action, planId) {
      confirmationTitle.textContent = title;
      confirmationMessage.textContent = message;
      confirmationModal.classList.add('active');
      
      currentAction = action;
      currentPlanId = planId;
  }
  
  // Handle confirmed action
  function handleConfirmedAction() {
      confirmationModal.classList.remove('active');
      
      switch (currentAction) {
          case 'deactivate':
          case 'activate':
              togglePlanStatus(currentPlanId, currentAction);
              break;
          case 'delete':
              deletePlan(currentPlanId);
              break;
      }
      
      currentAction = null;
      currentPlanId = null;
  }
  
  // Close confirmation modal
  function closeConfirmationModalFunc() {
      confirmationModal.classList.remove('active');
      currentAction = null;
      currentPlanId = null;
  }
  
  // Show message modal
  function showMessage(title, text) {
      messageTitle.textContent = title;
      messageText.textContent = text;
      messageModal.classList.add('active');
  }
  
  // Close message modal
  function closeMessageModalFunc() {
      messageModal.classList.remove('active');
  }
  
  // Reset add form
  function resetAddForm() {
      document.getElementById('planName').value = '';
      document.getElementById('returnRate').value = '';
      document.getElementById('duration').value = '';
      document.getElementById('minDeposit').value = '';
      document.getElementById('maxDeposit').value = '';
      document.getElementById('planStatus').value = 'active';
      document.getElementById('planDescription').value = '';
  }
});