document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authenticated
    function checkAuth() {
        const token = localStorage.getItem('token');
        if (!token) {
            // Redirect to login if not authenticated
            window.location.href = '../index.html';
            return;
        }
    }
    // Check authentication status
    checkAuth();
});