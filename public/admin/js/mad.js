

document.addEventListener('DOMContentLoaded', () => {
    // Hide preloader after page load
    const preloader = document.getElementById('preloader');
    if (preloader) {
      preloader.style.display = 'none';
    }
  
    // Function to fetch dashboard data
    async function fetchDashboardData() {
      try {
        const token = localStorage.getItem('token'); // Get token for authentication
        const response = await fetch('/api/v1/user/dashboard', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
  
        
        if (!response.ok) {
          Modal.error('Response Error', 'Failed to load dashboard');
          return;
        }
  
        const data = await response.json();
        console.log(data)
        updateDashboard(data);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        console.log(error)
        Modal.error('Server Error', 'Failed to load due to network error');
        
        
      }
    }
  
    // Function to update the dashboard UI
    function updateDashboard(data) {
     const username = localStorage.getItem('username')
        const {
            btcBal,
            ethBal,
            usdtBal
        } = data;
      document.querySelector('#un').textContent = username;
        // Update Total Balance and Revenue
      document.querySelector('.card-top h1').textContent = `$${Number(data.walletBalance).toFixed(3)}`;
      // document.querySelector('.card-top h1').textContent = `$${data.walletBalance}`;
      document.querySelector('.card-bottom h1').textContent = `$${data.totalRevenue.toFixed(3)}`;
  
      // Update Account Summary
      document.querySelector('#account .card-styles:nth-child(1) h1 b').textContent = data.activeInvestments.toFixed(2);
      document.querySelector('#account .card-styles:nth-child(2) h1 b').textContent = data.totalRevenue.toFixed(2);
      document.querySelector('#account .card-styles:nth-child(3) h1 b').textContent = data.totalWithdrawal.toFixed(2);
       
      // update cryto assest bal
      document.getElementsByClassName('btcEqu').textContent = `$${btcBal.toFixed(2)}`;
      document.getElementsByClassName('ethEqu').textContent = `$${ethBal.toFixed(2)}`;
      document.getElementsByClassName('usdtEqu').textContent = `$${usdtBal.toFixed(2)}`;

    
  
    }
  
    // Initialize dashboard
    fetchDashboardData();
  });