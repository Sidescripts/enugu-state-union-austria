// grok


document.addEventListener('DOMContentLoaded', function () {
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

  // Mobile sidebar toggle
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

  // Investment plan form toggle
  if (addPlanBtn && addPlanForm && plansList && cancelAddPlan) {
      addPlanBtn.addEventListener('click', () => {
          plansList.style.display = 'none';
          addPlanForm.style.display = 'block';
      });

      cancelAddPlan.addEventListener('click', () => {
          addPlanForm.style.display = 'none';
          plansList.style.display = 'block';
          document.getElementById('addPlanForm')?.reset();
      });
  } else {
      console.warn('Plan form elements not found');
  }

  // Function to fetch and render plans
  async function fetchAndRenderPlans() {
      const token = localStorage.getItem('token');
      try {
          if (!token) throw new Error('No authentication token found');

          const response = await fetch('/invest/all', {
              method: 'GET',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
              },
          });

          if (response.status === 401) {
              setTimeout(() => {
                  window.location.href = '../index.html';
              }, 2000);
              throw new Error('Session expired. Please login again.');
          }

          if (!response.ok) {
              throw new Error(`Failed to fetch plans: ${response.status}`);
          }

          const responseData = await response.json();
          const plans = responseData.data.plans || [];

          if (!Array.isArray(plans)) {
              throw new Error('Plans data is not an array');
          }

          // Clear table body
          if (plansTableBody) {
              plansTableBody.innerHTML = '';
          } else {
              throw new Error('Plans table body not found');
          }

          // Render plans
          plans.forEach(plan => {
              const row = document.createElement('tr');
              row.setAttribute('data-plan-id', plan.id);
              row.innerHTML = `
                  <td>${plan.name}</td>
                  <td>${plan.returnRate}% monthly</td>
                  <td>${plan.duration} months</td>
                  <td>$${parseFloat(plan.minDeposit).toFixed(2)}</td>
                  <td>$${parseFloat(plan.maxDeposit).toFixed(2)}</td>
                  <td><span class="badge ${plan.status === 'active' ? 'badge-approved' : 'badge-rejected'}">${
                  plan.status.charAt(0).toUpperCase() + plan.status.slice(1)
              }</span></td>
                  <td>
                      <button class="btn btn-sm btn-primary edit-plan-btn" data-plan-id="${plan.id}">Edit</button>
                      <button class="btn btn-sm btn-danger disable-plan-btn" data-plan-id="${plan.id}">${
                  plan.status === 'active' ? 'Disable' : 'Enable'
              }</button>
                      <button class="btn btn-sm btn-danger delete-plan-btn" data-plan-id="${plan.id}">Delete</button>
                  </td>
              `;
              plansTableBody.appendChild(row);
          });

          // Attach event listeners for edit, disable, and delete buttons
          attachPlanButtonListeners();
      } catch (error) {
          console.error('Error fetching plans:', error);
          showMessage('Error', `Failed to load plans: ${error.message}`);
      }
  }

  // Function to create a new plan
  async function createPlan(event) {
      event.preventDefault();
      const token = localStorage.getItem('token');
      const planName = document.getElementById('planName').value;
      const returnRate = document.getElementById('returnRate').value;
      const duration = document.getElementById('duration').value;
      const minDeposit = document.getElementById('minDeposit').value;
      const maxDeposit = document.getElementById('maxDeposit').value;
      const planStatus = document.getElementById('planStatus').value;
      const planDescription = document.getElementById('planDescription').value;

      if (!planName || !returnRate || !duration || !minDeposit || !maxDeposit) {
          showMessage('Error', 'Please fill all required fields');
          return;
      }

      try {
          const response = await fetch('/invest/create-plan', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                  name: planName,
                  returnRate: parseFloat(returnRate),
                  duration: parseInt(duration),
                  minDeposit: parseFloat(minDeposit),
                  maxDeposit: parseFloat(maxDeposit),
                  status: planStatus,
                  description: planDescription,
              }),
          });

          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(`Failed to create plan: ${errorData.message || response.status}`);
          }

          document.getElementById('addPlanForm')?.reset();
          addPlanForm.style.display = 'none';
          plansList.style.display = 'block';
          await fetchAndRenderPlans();
          showMessage('Success', 'Plan created successfully!');
      } catch (error) {
          console.error('Error creating plan:', error);
          showMessage('Error', `Failed to create plan: ${error.message}`);
      }
  }

  // Function to update a plan
  async function updatePlan(event) {
      event.preventDefault();
      const token = localStorage.getItem('token');
      const planId = document.getElementById('editPlanId').value;
      const planName = document.getElementById('editPlanName').value;
      const returnRate = document.getElementById('editReturnRate').value;
      const duration = document.getElementById('editDuration').value;
      const minDeposit = document.getElementById('editMinDeposit').value;
      const maxDeposit = document.getElementById('editMaxDeposit').value;
      const planStatus = document.getElementById('editPlanStatus').value;
      const planDescription = document.getElementById('editPlanDescription').value;

      if (!planId || !planName || !returnRate || !duration || !minDeposit || !maxDeposit) {
          showMessage('Error', 'Please fill all required fields');
          return;
      }

      try {
          const response = await fetch(`/invest/update/${planId}`, {
              method: 'PATCH',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                  name: planName,
                  returnRate: parseFloat(returnRate),
                  duration: parseInt(duration),
                  minDeposit: parseFloat(minDeposit),
                  maxDeposit: parseFloat(maxDeposit),
                  status: planStatus,
                  description: planDescription,
              }),
          });

          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(`Failed to update plan: ${errorData.message || response.status}`);
          }

          editPlanModal.classList.remove('active');
          await fetchAndRenderPlans();
          showMessage('Success', 'Plan updated successfully!');
      } catch (error) {
          console.error('Error updating plan:', error);
          showMessage('Error', `Failed to update plan: ${error.message}`);
      }
  }

  // Function to deactivate/activate a plan
  async function togglePlanStatus(planId, planName, currentStatus) {
      const token = localStorage.getItem('token');
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

      try {
          const response = await fetch(`/invest/deactivate/${planId}`, {
              method: 'PATCH',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({ status: newStatus }),
          });

          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(`Failed to ${newStatus} plan: ${errorData.message || response.status}`);
          }

          await fetchAndRenderPlans();
          showMessage('Success', `${planName} has been ${newStatus}d`);
      } catch (error) {
          console.error(`Error ${newStatus}ing plan:`, error);
          showMessage('Error', `Failed to ${newStatus} plan: ${error.message}`);
      }
  }

  // Function to delete a plan
  async function deletePlan(planId, planName) {
      const token = localStorage.getItem('token');

      try {
          const response = await fetch(`/invest/delete/${planId}`, {
              method: 'DELETE',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
              },
          });

          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(`Failed to delete plan: ${errorData.message || response.status}`);
          }

          await fetchAndRenderPlans();
          showMessage('Success', `${planName} has been deleted`);
      } catch (error) {
          console.error('Error deleting plan:', error);
          showMessage('Error', `Failed to delete plan: ${error.message}`);
      }
  }

  // Function to attach event listeners to plan buttons
  function attachPlanButtonListeners() {
      // Edit plan buttons
      document.querySelectorAll('.edit-plan-btn').forEach(btn => {
          btn.addEventListener('click', async () => {
              const planId = btn.getAttribute('data-plan-id');
              const token = localStorage.getItem('token');

              try {
                  const response = await fetch('/invest/all', {
                      method: 'GET',
                      headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`,
                      },
                  });

                  if (!response.ok) throw new Error('Failed to fetch plan data');
                  const responseData = await response.json();
                  const plan = responseData.data.plans.find(p => p.id === planId);

                  if (plan) {
                      document.getElementById('editPlanId').value = plan.id;
                      document.getElementById('editPlanName').value = plan.name;
                      document.getElementById('editReturnRate').value = plan.returnRate;
                      document.getElementById('editDuration').value = plan.duration;
                      document.getElementById('editMinDeposit').value = plan.minDeposit;
                      document.getElementById('editMaxDeposit').value = plan.maxDeposit;
                      document.getElementById('editPlanStatus').value = plan.status;
                      document.getElementById('editPlanDescription').value = plan.description || '';
                      editPlanModal.classList.add('active');
                  }
              } catch (error) {
                  console.error('Error fetching plan:', error);
                  showMessage('Error', `Failed to load plan: ${error.message}`);
              }
          });
      });

      // Disable/Enable plan buttons
      document.querySelectorAll('.disable-plan-btn').forEach(btn => {
          btn.addEventListener('click', () => {
              const planId = btn.getAttribute('data-plan-id');
              const planName = btn.parentElement.parentElement.cells[0].textContent;
              const currentStatus = btn.parentElement.parentElement.cells[5].querySelector('.badge').textContent.toLowerCase();
              showConfirmation(
                  `${currentStatus === 'active' ? 'Disable' : 'Enable'} Plan`,
                  `Are you sure you want to ${currentStatus === 'active' ? 'disable' : 'enable'} ${planName}?`,
                  () => togglePlanStatus(planId, planName, currentStatus)
              );
          });
      });

      // Delete plan buttons
      document.querySelectorAll('.delete-plan-btn').forEach(btn => {
          btn.addEventListener('click', () => {
              const planId = btn.getAttribute('data-plan-id');
              const planName = btn.parentElement.parentElement.cells[0].textContent;
              showConfirmation(
                  'Delete Plan',
                  `Are you sure you want to delete ${planName}?`,
                  () => deletePlan(planId, planName)
              );
          });
      });
  }

  // Confirmation modal functions
  function showConfirmation(title, message, confirmCallback) {
      confirmationTitle.textContent = title;
      confirmationMessage.textContent = message;
      confirmationModal.classList.add('active');

      confirmAction.onclick = () => {
          confirmationModal.classList.remove('active');
          if (confirmCallback) confirmCallback();
      };

      cancelAction.onclick = () => {
          confirmationModal.classList.remove('active');
      };

      closeConfirmationModal.onclick = () => {
          confirmationModal.classList.remove('active');
      };
  }

  // Message modal functions
  function showMessage(title, text) {
      messageTitle.textContent = title;
      messageText.textContent = text;
      messageModal.classList.add('active');
  }

  // Close modals
  if (closeEditModal) {
      closeEditModal.addEventListener('click', () => {
          editPlanModal.classList.remove('active');
          document.getElementById('editPlanForm')?.reset();
      });
  }

  if (cancelEditPlan) {
      cancelEditPlan.addEventListener('click', () => {
          editPlanModal.classList.remove('active');
          document.getElementById('editPlanForm')?.reset();
      });
  }

  if (closeMessageModal && closeMessage) {
      closeMessageModal.addEventListener('click', () => {
          messageModal.classList.remove('active');
      });
      closeMessage.addEventListener('click', () => {
          messageModal.classList.remove('active');
      });
  }

  // Form submission handlers
  if (saveNewPlan) {
      saveNewPlan.addEventListener('click', createPlan);
  }

  if (saveEditPlan) {
      saveEditPlan.addEventListener('click', updatePlan);
  }

  // Initialize by fetching plans
  fetchAndRenderPlans();
});