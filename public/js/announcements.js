
// Auto-update copyright year
document.getElementById("year").textContent = new Date().getFullYear();

// Base API URL
const API_BASE = '/api/v1';

// DOM Elements
const upcomingAnnouncements = document.querySelector('#upcoming-announcements');
const pastAnnouncements = document.querySelector('#past-announcements');
const notificationBanner = document.querySelector('.new-announcement-banner');

document.addEventListener('DOMContentLoaded', async () => {
    // Dark/Light Mode Toggle
    document.getElementById('modeToggle').addEventListener('click', function() {
        const body = document.body;
        const icon = this.querySelector('i');
        if (body.classList.contains('light-mode')) {
            body.classList.remove('light-mode');
            body.classList.add('dark-mode');
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            body.classList.remove('dark-mode');
            body.classList.add('light-mode');
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 70,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Newsletter subscription
    document.querySelector('.newsletter-btn').addEventListener('click', function() {
        const email = document.querySelector('.newsletter-input').value;
        if (email && isValidEmail(email)) {
            alert('Thank you for subscribing to our newsletter!');
            document.querySelector('.newsletter-input').value = '';
        } else {
            alert('Please enter a valid email address.');
        }
    });

    // Navbar background change on scroll
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(18, 18, 18, 0.95)';
            navbar.style.padding = '10px 0';
        } else {
            navbar.style.background = 'rgba(18, 18, 18, 0.95)';
            navbar.style.padding = '15px 0';
        }
    });

    // Load announcements
    await loadAnnouncements();
});

async function loadAnnouncements() {
    try {
        const response = await fetch(`${API_BASE}/announcements/all`, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('Failed to fetch announcements');
        const { announcements, isNewNotification } = await response.json();
        const sortedAnnouncements = announcements.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Show/hide notification banner
        notificationBanner.style.display = isNewNotification ? 'block' : 'none';

        // Clear sections
        upcomingAnnouncements.innerHTML = '';
        pastAnnouncements.innerHTML = '';

        // Render up to 2 newest in Upcoming Announcements
        const upcoming = sortedAnnouncements.slice(0, 2);
        if (!upcoming.length) {
            upcomingAnnouncements.innerHTML = '<p class="text-center">No upcoming announcements.</p>';
        } else {
            upcoming.forEach((ann, index) => {
                const card = document.createElement('div');
                card.className = 'col-lg-6 mb-4';
                card.innerHTML = `
                    <div class="event-card">
                        ${index === 0 ? '<span class="new-badge">NEW</span>' : ''}
                        <div class="event-image">
                            <img src="${ann.photoUrls[0] || 'https://via.placeholder.com/300x200/a18cd1/ffffff?text=' + encodeURIComponent(ann.title)}" alt="${ann.title}">
                        </div>
                        <div class="event-content">
                            <span class="event-date">${ann.date}</span>
                            <h3 class="event-title">${ann.title}</h3>
                            <p class="event-description">${ann.description}</p>
                            <div class="event-meta">
                                <div class="event-location">
                                    <i class="fas fa-map-marker-alt"></i>
                                    <span>${ann.caption || 'N/A'}</span>
                                </div>
                                <div class="event-time">
                                    <i class="fas fa-clock"></i>
                                    <span>${new Date(ann.createdAt).toLocaleTimeString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                upcomingAnnouncements.appendChild(card);
            });
        }

        // Render the rest in Past Announcements
        const past = sortedAnnouncements.slice(2);
        if (!past.length) {
            pastAnnouncements.innerHTML = '<p class="text-center">No past announcements.</p>';
        } else {
            past.forEach(ann => {
                const card = document.createElement('div');
                card.className = 'col-lg-6 mb-4';
                card.innerHTML = `
                    <div class="announcement-card">
                        <span class="announcement-date">${ann.date}</span>
                        <h3 class="announcement-title">${ann.title}</h3>
                        <p class="announcement-content">${ann.description}</p>
                        <div class="announcement-image">
                            <img src="${ann.photoUrls[0] || 'https://via.placeholder.com/300x200/a18cd1/ffffff?text=' + encodeURIComponent(ann.title)}" alt="${ann.title}">
                        </div>
                    </div>
                `;
                pastAnnouncements.appendChild(card);
            });
        }

        // Hide notification dot after 5 seconds
        setTimeout(() => {
            const notificationDot = document.querySelector('.notification-dot');
            if (notificationDot) notificationDot.style.display = 'none';
        }, 5000);
    } catch (err) {
        console.error('Fetch error:', err);
        upcomingAnnouncements.innerHTML = '<p class="text-center">Failed to load announcements.</p>';
        pastAnnouncements.innerHTML = '<p class="text-center">Failed to load past announcements.</p>';
    }
}

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}
