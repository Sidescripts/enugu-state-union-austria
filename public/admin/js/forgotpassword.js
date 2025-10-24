document.addEventListener('DOMContentLoaded', function() {
  // Form submission handler
  document.getElementById("forgot-password-form").addEventListener("submit", async function (e) {
    e.preventDefault();

    const emailInput = document.getElementById("forgot-email-input");
    const submitButton = this.querySelector('button[type="submit"]');
    const email = emailInput.value.trim();

    // Validation
    if (!email) {
      showError("Please enter your email address");
      emailInput.focus();
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError("Please enter a valid email address");
      emailInput.focus();
      return;
    }
    console.log(email);

    // Disable button and show loading state
    submitButton.disabled = true;
    const originalText = submitButton.textContent;
    submitButton.textContent = "Processing...";

    try {
      console.log("ojuru m onu");
      const response = await fetch("/api/v1/auth/forget-password", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
       console.log(data);

      if (response.ok) {
        showSuccess();
        emailInput.value = ""; // Clear the input
      } else {
        showError(data.message || "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Password reset error:", error);
      showError("Network error. Please check your connection and try again.");
    } finally {
      // Re-enable button
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  });

  // Modal helpers
  function showSuccess() {
    const modal = document.getElementById("successModal");
    if (modal) {
      modal.style.display = "flex";
      // Focus on the first focusable element in the modal for accessibility
      const focusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable) focusable.focus();
    }
  }

  function showError(msg) {
    const errorElement = document.getElementById("error-text");
    const modal = document.getElementById("errorModal");
    
    if (errorElement && modal) {
      errorElement.textContent = msg;
      modal.style.display = "flex";
      
      // Focus on the error message or close button for accessibility
      const focusable = modal.querySelector('.close') || errorElement;
      if (focusable) focusable.focus();
    }
  }

  // Close modals when clicking X
  document.querySelectorAll(".close").forEach(btn => {
    btn.addEventListener("click", () => {
      const modal = btn.closest(".modal");
      if (modal) {
        modal.style.display = "none";
        // Return focus to the email input when closing modal
        document.getElementById("forgot-email-input").focus();
      }
    });
  });

  // Close on outside click
  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      e.target.style.display = "none";
      // Return focus to the email input when closing modal
      document.getElementById("forgot-email-input").focus();
    }
  });

  // Support for submitting form with Enter key
  document.getElementById("forgot-email-input").addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      document.getElementById("forgot-password-form").dispatchEvent(new Event("submit"));
    }
  });
});