// reset-password.js

// 1. Get the token from the URL query string (e.g. reset-password.html?token=abcd123)
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get("token");
console.log(token);

// 2. Get form and inputs
const form = document.getElementById("new-password-form");
const newPasswordInput = document.getElementById("new-password-input");
const confirmPasswordInput = document.getElementById("confirm-new-password-input");
const messageBox = document.getElementById("new-password-message");

// 3. Handle form submission
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const newPassword = newPasswordInput.value.trim();
  const confirmPassword = confirmPasswordInput.value.trim();

  // Step 1: Validate
  if (!newPassword || !confirmPassword) {
    showMessage("Please fill in both fields.", "red");
    return;
  }

  if (newPassword !== confirmPassword) {
    showMessage("Passwords do not match!", "red");
    return;
  }

  if (!token) {
    showMessage("Invalid or missing reset token.", "red");
    return;
  }

  // Step 2: Call backend API
  try {
    const response = await fetch("/api/v1/auth/new-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: token,
        newPassword: newPassword,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      showMessage("✅ Password reset successful! Redirecting to login...", "green");
      // Redirect after 3 seconds
      setTimeout(() => {
        window.location.href = "./login.html";
      }, 3000);
    } else {
      showMessage(data.message || " Something went wrong.", "red");
    }
  } catch (error) {
    console.error("Error:", error);
    showMessage("⚠️ Network error, please try again.", "red");
  }
});

// Helper function to show messages
function showMessage(text, color) {
  messageBox.textContent = text;
  messageBox.style.color = color;
}

// Optional: Password toggle visibility
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  input.type = input.type === "password" ? "text" : "password";
}
