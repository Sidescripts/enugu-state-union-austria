// auth.js
document.addEventListener('DOMContentLoaded', () => {
    // Function to check if user is logged in
    function checkAuth() {
      const token = localStorage.getItem('token');
      if (!token) {
        // Redirect to login page if no token is found
        window.location.href = '../index.html'; // Adjust the path to your login page
      }
    }
  
    // Run authentication check
    checkAuth();
});
