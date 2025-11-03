// js/main.js
document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('menuToggle');
  const overlay = document.getElementById('sidebarOverlay');

  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
  });

  overlay.addEventListener('click', () => {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
  });
});

// Shared notification system
function showNotification(type = 'info', title, message, timeout = 5000) {
  const container = document.getElementById('notificationContainer');
  const notif = document.createElement('div');
  notif.className = `notification notification-${type}`;
  notif.innerHTML = `
    <div class="notification-icon"><i class="fas fa-bell"></i></div>
    <div class="notification-content">
      <div class="notification-title">${title}</div>
      <div class="notification-message">${message}</div>
    </div>
    <button class="notification-close"><i class="fas fa-times"></i></button>
  `;
  container.appendChild(notif);
  setTimeout(() => notif.classList.add('show'), 100);

  notif.querySelector('.notification-close').onclick = () => {
    notif.classList.remove('show');
    setTimeout(() => notif.remove(), 300);
  };

  if (timeout) {
    setTimeout(() => {
      if (notif.parentNode) {
        notif.classList.remove('show');
        setTimeout(() => notif.remove(), 300);
      }
    }, timeout);
  }
}