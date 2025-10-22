//    // DOM Elements
//         const menuToggle = document.getElementById('menuToggle');
//         const sidebar = document.getElementById('sidebar');
//         const sidebarOverlay = document.getElementById('sidebarOverlay');
//         const navItems = document.querySelectorAll('.nav-item');
//         const pages = document.querySelectorAll('.page');
//         const tabLinks = document.querySelectorAll('.nav-link');
//         const tabContents = document.querySelectorAll('.tab-content');
//         const addPlanBtn = document.getElementById('addPlanBtn');
//         const addPlanForm = document.getElementById('add-plan-form');
//         const plansList = document.getElementById('plans-list');
//         const cancelAddPlan = document.getElementById('cancelAddPlan');
        
//         // Mobile sidebar toggle
//         menuToggle.addEventListener('click', () => {
//             sidebar.classList.toggle('active');
//             sidebarOverlay.classList.toggle('active');
//         });
        
//         sidebarOverlay.addEventListener('click', () => {
//             sidebar.classList.remove('active');
//             sidebarOverlay.classList.remove('active');
//         });
        
//         // Navigation
//         navItems.forEach(item => {
//             item.addEventListener('click', (e) => {
//                 if (item.id === 'logoutBtn') {
//                     // Handle logout
//                     if (confirm('Are you sure you want to logout?')) {
//                         alert('Logout successful!');
//                         // In a real app, you would redirect to login page
//                     }
//                     return;
//                 }
//                 page
//                 const pageId = item.getAttribute('data-page');
//                 if (pageId) {
//                     showPage(pageId);
                    
//                     // Update active state in sidebar
//                     navItems.forEach(navItem => {
//                         navItem.classList.remove('active');
//                     });
//                     item.classList.add('active');
//                 }
//             });
//         });
        
//         // Tab functionality
//         tabLinks.forEach(link => {
//             link.addEventListener('click', () => {
//                 const tabId = link.getAttribute('data-tab');
                
//                 // Update active tab
//                 tabLinks.forEach(tab => {
//                     tab.classList.remove('active');
//                 });
//                 link.classList.add('active');
                
//                 // Show corresponding tab content
//                 tabContents.forEach(content => {
//                     content.classList.remove('active');
//                 });
//                 document.getElementById(tabId).classList.add('active');
//             });
//         });
        
//         // Investment plan form toggle
//         addPlanBtn.addEventListener('click', () => {
//             plansList.style.display = 'none';
//             addPlanForm.style.display = 'block';
//         });
        
//         cancelAddPlan.addEventListener('click', () => {
//             addPlanForm.style.display = 'none';
//             plansList.style.display = 'block';
//         });
        
//         // Show specific page
//         function showPage(pageId) {
//             pages.forEach(page => {
//                 page.classList.remove('active');
//             });
//             document.getElementById(pageId).classList.add('active');
//         }
        
//         // Initialize dashboard stats with random data
//         function initDashboardStats() {
//             document.getElementById('totalUsers').textContent = '1,248';
//             document.getElementById('activeUsers').textContent = '984';
//             document.getElementById('verifiedUsers').textContent = '856';
//             document.getElementById('totalDeposits').textContent = '$245,780';
//             document.getElementById('totalWithdrawals').textContent = '$128,450';
//             document.getElementById('totalInvestments').textContent = '$367,890';
            
//             document.getElementById('todayDeposits').textContent = '$5,240';
//             document.getElementById('todayWithdrawals').textContent = '$3,120';
//             document.getElementById('todayRegistrations').textContent = '24';
//             document.getElementById('todayInvestments').textContent = '$8,750';
            
//             document.getElementById('pendingDepositsCount').textContent = '5';
//             document.getElementById('pendingWithdrawalsCount').textContent = '3';
//             document.getElementById('unverifiedUsersCount').textContent = '2';
            
//             // Add sample pending items
//             const pendingDepositsList = document.getElementById('pendingDepositsList');
//             pendingDepositsList.innerHTML = `
//                 <div class="action-item">
//                     <div class="action-item-info">
//                         <h4>John Doe</h4>
//                         <p>Bitcoin deposit</p>
//                     </div>
//                     <div class="action-item-amount">$500.00</div>
//                 </div>
//                 <div class="action-item">
//                     <div class="action-item-info">
//                         <h4>Jane Smith</h4>
//                         <p>Bank transfer</p>
//                     </div>
//                     <div class="action-item-amount">$1,200.00</div>
//                 </div>
//             `;
            
//             const pendingWithdrawalsList = document.getElementById('pendingWithdrawalsList');
//             pendingWithdrawalsList.innerHTML = `
//                 <div class="action-item">
//                     <div class="action-item-info">
//                         <h4>John Doe</h4>
//                         <p>Bank transfer</p>
//                     </div>
//                     <div class="action-item-amount">$300.00</div>
//                 </div>
//             `;
            
//             const unverifiedUsersList = document.getElementById('unverifiedUsersList');
//             unverifiedUsersList.innerHTML = `
//                 <div class="action-item">
//                     <div class="action-item-info">
//                         <h4>Robert Johnson</h4>
//                         <p>Registered: 2023-10-03</p>
//                     </div>
//                 </div>
//             `;
//         }
        
//         // Initialize the dashboard
//         initDashboardStats();




// global.js
// DOM Elements
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');

// Mobile sidebar toggle
menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('active');
    sidebarOverlay.classList.toggle('active');
});

sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.remove('active');
    sidebarOverlay.classList.remove('active');
});

// Navigation
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        if (item.id === 'logoutBtn') {
            // Handle logout
            if (confirm('Are you sure you want to logout?')) {
                alert('Logout successful!');
                // In a real app, you would redirect to login page
            }
            return;
        }
        
        const pageId = item.getAttribute('data-page');
        if (pageId) {
            showPage(pageId);
            
            // Update active state in sidebar
            navItems.forEach(navItem => {
                navItem.classList.remove('active');
            });
            item.classList.add('active');
        }
    });
});

// Show specific page
function showPage(pageId) {
    pages.forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}