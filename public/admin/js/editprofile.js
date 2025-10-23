     // Fetch user details on page load
        document.addEventListener('DOMContentLoaded', async () => {
          const token = localStorage.getItem('token');
            try {
                const response = await fetch('/api/v1/user/get-user', {
                    method: 'GET',
                    headers: { 
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    }
                });

                if (response.status == 401) {
                  setTimeout(() => {
                    window.location.href="../pages/login.html"
                  }, 3000);
                }

                if (!response.ok) throw new Error('Failed to fetch user details');
                const data = await response.json();
                console.log(data);
                console.log(data.username);

                // Populate form fields with fetched data
                document.getElementById('username').value = data.username || '';
                document.getElementById('fullname').value = data.fullname || '';
                document.getElementById('email').value = data.email || '';
                document.getElementById('phoneNumber').value = data.phoneNumber || '';
                const countrySelect = document.getElementById('country');
                if (data.country) {
                    countrySelect.value = data.country;
                }
            } catch (error) {
              Modal.error("Network error1", error.message);
              console.log(error);
            }
        });

        // Handle form submission
        document.getElementById('updateButton').addEventListener('click', async () => {
            const fullname = document.getElementById('fullname').value.trim();
            const email = document.getElementById('email').value.trim();
            const country = document.getElementById('country').value;
            const phoneNumber = document.getElementById('phoneNumber').value.trim();

            // Basic validation
            if (country === 'Select') {
              Modal.error("Validation error", "Please select a valid country");
                return;
            }
            if (!email.includes('@')) {
                  Modal.error("Validation error", "Please enter a valid email address");
                return;
            }

            const token = localStorage.getItem("token");
            try {
                const response = await fetch('/api/v1/user/update-details', {
                    method: 'POST',
                    headers: { 
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`,
                     },
                    body: JSON.stringify({
                        fullname: fullname,
                        email: email,
                        country: country,
                        phoneNum: phoneNumber
                    })
                });

                if (response.status == 401) {
                  setTimeout(() => {
                    window.location.href="../pages/login.html"
                  }, 3000);
                }

                if (!response.ok) throw new Error('Failed to update user details');
                Modal.success("Success", "User profile updated successfully.");
                  setTimeout(() => {
                    window.location.href="../gratoms-dashboard/html/profile-settings.html"
                  }, 2000);
            } catch (error) {
                Modal.error("Network error2", error.message);
                console.log(error);
            }
        });

        // Show error message
        function showError(message) {
            const errorDiv = document.getElementById('error');
            errorDiv.textContent = message;
            errorDiv.classList.remove('hidden');
            document.getElementById('success').classList.add('hidden');
        }

        // Show success message
        function showSuccess(message) {
            const successDiv = document.getElementById('success');
            successDiv.textContent = message;
            successDiv.classList.remove('hidden');
            document.getElementById('error').classList.add('hidden');
        }