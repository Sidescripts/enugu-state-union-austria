// // Base API URL
// const API_BASE = '/api/v1';

// // DOM Elements
// const upcomingAnnouncements = document.querySelector('#upcoming-announcements');
// const pastAnnouncements = document.querySelector('#past-announcements');
// const notificationBanner = document.querySelector('.new-announcement-banner');
// const notificationDot = document.querySelector('.notification-dot');

// document.addEventListener('DOMContentLoaded', async () => {
//     // Dark/Light Mode Toggle
//     document.getElementById('modeToggle')?.addEventListener('click', function () {
//         const body = document.body;
//         const icon = this.querySelector('i');
//         if (body.classList.contains('light-mode')) {
//             body.classList.remove('light-mode');
//             body.classList.add('dark-mode');
//             icon.classList.remove('fa-moon');
//             icon.classList.add('fa-sun');
//         } else {
//             body.classList.remove('dark-mode');
//             body.classList.add('light-mode');
//             icon.classList.remove('fa-sun');
//             icon.classList.add('fa-moon');
//         }
//     });

//     // Smooth scrolling
//     document.querySelectorAll('a[href^="#"]').forEach(anchor => {
//         anchor.addEventListener('click', function (e) {
//             e.preventDefault();
//             const targetId = this.getAttribute('href');
//             if (targetId === '#') return;
//             const targetElement = document.querySelector(targetId);
//             if (targetElement) {
//                 window.scrollTo({
//                     top: targetElement.offsetTop - 70,
//                     behavior: 'smooth'
//                 });
//             }
//         });
//     });

//     // Navbar scroll effect
//     window.addEventListener('scroll', function () {
//         const navbar = document.querySelector('.navbar');
//         if (!navbar) return;
//         if (window.scrollY > 50) {
//             navbar.style.background = 'rgba(18, 18, 18, 0.95)';
//             navbar.style.padding = '10px 0';
//         } else {
//             navbar.style.background = 'rgba(18, 18, 18, 0.95)';
//             navbar.style.padding = '15px 0';
//         }
//     });

//     // Load announcements
//     await loadAnnouncements();
// });

// // ————————————————————————————————————————
// // Load & Render Announcements (Aligned with Backend)
// // ————————————————————————————————————————
// async function loadAnnouncements() {
//     try {
//         // Show loading state
//         if (upcomingAnnouncements) upcomingAnnouncements.innerHTML = '<p class="text-center text-muted">Loading...</p>';
//         if (pastAnnouncements) pastAnnouncements.innerHTML = '';

//         // Build query params to match backend
//         const params = new URLSearchParams({
//             limit: 10,
//             importantOnly: false,
//             sortBy: 'created_at',
//             sortOrder: 'DESC'
//         });

//         const response = await fetch(`${API_BASE}/u/active/announcements?${params}`, {
//             method: 'GET',
//             headers: {
//                 'Accept': 'application/json',
//                 'Content-Type': 'application/json'
//             },
//             cache: 'no-cache'
//         });

//         if (!response.ok) {
//             const error = await response.text();
//             throw new Error(`HTTP ${response.status}: ${error}`);
//         }

//         const result = await response.json();

//         if (!result.success) {
//             throw new Error(result.message || 'Failed to load announcements');
//         }

//         const announcements = Array.isArray(result.data) ? result.data : [];

//         if (announcements.length === 0) {
//             if (upcomingAnnouncements) {
//                 upcomingAnnouncements.innerHTML = '<p class="text-center text-muted">No active announcements.</p>';
//             }
//             return;
//         }

//         // Sort: important first, then by created_at DESC (backend already does this)
//         const sorted = announcements.sort((a, b) => {
//             if (a.is_important && !b.is_important) return -1;
//             if (!a.is_important && b.is_important) return 1;
//             return new Date(b.created_at) - new Date(a.created_at);
//         });

//         // Show notification banner if any important & recent
//         const hasImportant = sorted.some(a => a.is_important);
//         if (notificationBanner) {
//             notificationBanner.style.display = hasImportant ? 'block' : 'none';
//         }
//         if (notificationDot && hasImportant) {
//             notificationDot.style.display = 'inline-block';
//             setTimeout(() => {
//                 if (notificationDot) notificationDot.style.display = 'none';
//             }, 5000);
//         }

//         // Clear containers
//         if (upcomingAnnouncements) upcomingAnnouncements.innerHTML = '';
//         if (pastAnnouncements) pastAnnouncements.innerHTML = '';

//         // ——— UPCOMING: Top 2 ———
//         const upcoming = sorted.slice(0, 2);
//         if (upcoming.length === 0) {
//             if (upcomingAnnouncements) {
//                 upcomingAnnouncements.innerHTML = '<p class="text-center text-muted">No upcoming announcements.</p>';
//             }
//         } else {
//             upcoming.forEach((ann, index) => {
//                 const card = createUpcomingCard(ann, index === 0);
//                 upcomingAnnouncements?.appendChild(card);
//             });
//         }

//         // ——— PAST: Rest ———
//         const past = sorted.slice(2);
//         if (past.length === 0) {
//             if (pastAnnouncements) {
//                 pastAnnouncements.innerHTML = '<p class="text-center text-muted">No past announcements.</p>';
//             }
//         } else {
//             past.forEach(ann => {
//                 const card = createPastCard(ann);
//                 pastAnnouncements?.appendChild(card);
//             });
//         }

//     } catch (err) {
//         console.error('Failed to load announcements:', err);
//         const errorMsg = '<p class="text-center text-danger">Failed to load announcements. <a href="javascript:location.reload();" class="text-decoration-underline">Retry</a></p>';
//         if (upcomingAnnouncements) upcomingAnnouncements.innerHTML = errorMsg;
//         if (pastAnnouncements) pastAnnouncements.innerHTML = errorMsg;
//     }
// }

// // ————————————————————————————————————————
// // Card Creators (Safe HTML + Fallbacks)
// // ————————————————————————————————————————
// function escapeHTML(str) {
//     const div = document.createElement('div');
//     div.textContent = str || '';
//     return div.innerHTML;
// }

// function getFirstImage(images) {
//     if (!images || !Array.isArray(images)) return null;
//     return images.find(img => img && img.trim()) || null;
// }

// function getPlaceholder(title) {
//     const text = encodeURIComponent((title || 'A').substring(0, 2).toUpperCase());
//     return `https://via.placeholder.com/300x200/a18cd1/ffffff?text=${text}`;
// }

// function createUpcomingCard(ann, isNew = false) {
//     const card = document.createElement('div');
//     card.className = 'col-lg-6 mb-4';

//     const imageUrl = getFirstImage(ann.images) || getPlaceholder(ann.title);
//     const dateStr = ann.expires_at
//         ? new Date(ann.expires_at).toLocaleDateString()
//         : 'Ongoing';

//     card.innerHTML = `
//         <div class="event-card ${ann.is_important ? 'important' : ''}">
//             ${isNew ? '<span class="new-badge">NEW</span>' : ''}
//             <div class="event-image">
//                 <img src="${imageUrl}" 
//                      alt="${escapeHTML(ann.title)}" 
//                      loading="lazy"
//                      onerror="this.src='${getPlaceholder(ann.title)}'">
//             </div>
//             <div class="event-content">
//                 <span class="event-date">${dateStr}</span>
//                 <h3 class="event-title">${escapeHTML(ann.title)}</h3>
//                 <p class="event-description">${escapeHTML(ann.content.substring(0, 120))}${ann.content.length > 120 ? '...' : ''}</p>
//                 <div class="event-meta">
//                     <div class="event-time">
//                         <i class="fas fa-clock"></i>
//                         <span>${new Date(ann.created_at).toLocaleTimeString()}</span>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     `.trim();
//     return card;
// }

// function createPastCard(ann) {
//     const card = document.createElement('div');
//     card.className = 'col-lg-6 mb-4';

//     const imageUrl = getFirstImage(ann.images) || getPlaceholder(ann.title);

//     card.innerHTML = `
//         <div class="announcement-card">
//             <span class="announcement-date">${new Date(ann.created_at).toLocaleDateString()}</span>
//             <h3 class="announcement-title">${escapeHTML(ann.title)}</h3>
//             <p class="announcement-content">${escapeHTML(ann.content)}</p>
//             ${imageUrl ? `
//             <div class="announcement-image">
//                 <img src="${imageUrl}" 
//                      alt="${escapeHTML(ann.title)}" 
//                      loading="lazy"
//                      onerror="this.src='${getPlaceholder(ann.title)}'">
//             </div>` : ''}
//         </div>
//     `.trim();
//     return card;
// }

// // ————————————————————————————————————————
// // Email Validation (unchanged)
// // ————————————————————————————————————————
// function isValidEmail(email) {
//     const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     return re.test(email);
// }


/* ==============================================================
   announcements.js  –  fully aligned with backend + 2-image gallery
   ============================================================== */
const API_BASE = '/api/v1';

// DOM Elements
const upcomingAnnouncements = document.querySelector('#upcoming-announcements');
const pastAnnouncements     = document.querySelector('#past-announcements');
const notificationBanner    = document.querySelector('.new-announcement-banner');
const notificationDot       = document.querySelector('.notification-dot');

document.addEventListener('DOMContentLoaded', async () => {
    /* ------------------- Dark / Light Mode ------------------- */
    document.getElementById('modeToggle')?.addEventListener('click', function () {
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

    /* ------------------- Smooth scroll ------------------- */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const target = document.querySelector(targetId);
            if (target) {
                window.scrollTo({ top: target.offsetTop - 70, behavior: 'smooth' });
            }
        });
    });

    /* ------------------- Navbar scroll effect ------------------- */
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;
        navbar.style.background = 'rgba(18, 18, 18, 0.95)';
        navbar.style.padding = window.scrollY > 50 ? '10px 0' : '15px 0';
    });

    /* ------------------- Load announcements ------------------- */
    await loadAnnouncements();
});

/* ==============================================================
   LOAD ANNOUNCEMENTS
   ============================================================== */
async function loadAnnouncements() {
    try {
        // loading state
        if (upcomingAnnouncements) upcomingAnnouncements.innerHTML = '<p class="text-center text-muted">Loading...</p>';
        if (pastAnnouncements)     pastAnnouncements.innerHTML = '';

        const params = new URLSearchParams({
            limit: 10,
            importantOnly: false,
            sortBy: 'created_at',
            sortOrder: 'DESC'
        });

        const response = await fetch(`${API_BASE}/u/active/announcements?${params}`, {
            method: 'GET',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            cache: 'no-cache'
        });

        if (!response.ok) {
            const txt = await response.text();
            throw new Error(`HTTP ${response.status}: ${txt}`);
        }

        const result = await response.json();
        if (!result.success) throw new Error(result.message || 'Failed');

        const announcements = Array.isArray(result.data) ? result.data : [];

        if (!announcements.length) {
            if (upcomingAnnouncements) {
                upcomingAnnouncements.innerHTML = '<p class="text-center text-muted">No active announcements.</p>';
            }
            return;
        }

        // backend already sorts, but we keep a safe secondary sort
        const sorted = announcements.sort((a, b) => {
            if (a.is_important && !b.is_important) return -1;
            if (!a.is_important && b.is_important) return 1;
            return new Date(b.created_at) - new Date(a.created_at);
        });

        // notification banner / dot
        const hasImportant = sorted.some(a => a.is_important);
        if (notificationBanner) notificationBanner.style.display = hasImportant ? 'block' : 'none';
        if (notificationDot && hasImportant) {
            notificationDot.style.display = 'inline-block';
            setTimeout(() => notificationDot.style.display = 'none', 5000);
        }

        // clear containers
        if (upcomingAnnouncements) upcomingAnnouncements.innerHTML = '';
        if (pastAnnouncements)     pastAnnouncements.innerHTML = '';

        /* ---------- UPCOMING (top 2) ---------- */
        const upcoming = sorted.slice(0, 2);
        if (upcoming.length) {
            upcoming.forEach((ann, i) => {
                upcomingAnnouncements?.appendChild(createUpcomingCard(ann, i === 0));
            });
        } else if (upcomingAnnouncements) {
            upcomingAnnouncements.innerHTML = '<p class="text-center text-muted">No upcoming announcements.</p>';
        }

        /* ---------- PAST (rest) ---------- */
        const past = sorted.slice(2);
        if (past.length) {
            past.forEach(ann => pastAnnouncements?.appendChild(createPastCard(ann)));
        } else if (pastAnnouncements) {
            pastAnnouncements.innerHTML = '<p class="text-center text-muted">No past announcements.</p>';
        }

    } catch (err) {
        console.error('loadAnnouncements error:', err);
        const msg = '<p class="text-center text-danger">Failed to load announcements. <a href="javascript:location.reload();" class="text-decoration-underline">Retry</a></p>';
        if (upcomingAnnouncements) upcomingAnnouncements.innerHTML = msg;
        if (pastAnnouncements)     pastAnnouncements.innerHTML = msg;
    }
}

/* ==============================================================
   HELPERS
   ============================================================== */
const escapeHTML = str => {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
};

const getPlaceholder = title => {
    const txt = encodeURIComponent((title || 'A').substring(0, 2).toUpperCase());
    return `https://via.placeholder.com/300x200/a18cd1/ffffff?text=${txt}`;
};

const getValidImages = images => {
    if (!Array.isArray(images)) return [];
    return images.filter(i => i && i.trim());
};

/* ==============================================================
   CARD CREATORS – 2-image gallery + download + lightbox
   ============================================================== */
const createGalleryHTML = (images, title) => {
    const valid = getValidImages(images);
    if (!valid.length) return `<div class="no-image">No image</div>`;

    return `
        <div class="image-gallery">
            ${valid.map((url, idx) => `
                <div class="gallery-item ${valid.length === 1 ? 'single' : ''}">
                    <img src="${url}"
                         alt="${escapeHTML(title)} – ${idx + 1}"
                         class="gallery-img"
                         loading="lazy"
                         onerror="this.src='${getPlaceholder(title)}'"
                         data-full="${url}"
                         data-download="${url}">
                    <button class="download-btn" data-url="${url}" title="Download">
                        <i class="fas fa-download"></i>
                    </button>
                </div>
            `).join('')}
        </div>
    `;
};

function createUpcomingCard(ann, isNew = false) {
    const card = document.createElement('div');
    card.className = 'col-lg-6 mb-4';

    const dateStr = ann.expires_at
        ? new Date(ann.expires_at).toLocaleDateString()
        : 'Ongoing';

    card.innerHTML = `
        <div class="event-card ${ann.is_important ? 'important' : ''}">
            ${isNew ? '<span class="new-badge">NEW</span>' : ''}
            <div class="event-image">
                ${createGalleryHTML(ann.images, ann.title)}
            </div>
            <div class="event-content">
                <span class="event-date">${dateStr}</span>
                <h3 class="event-title">${escapeHTML(ann.title)}</h3>
                <p class="event-description">
                    ${escapeHTML(ann.content.substring(0, 120))}${ann.content.length > 120 ? '...' : ''}
                </p>
                <div class="event-meta">
                    <div class="event-time">
                        <i class="fas fa-clock"></i>
                        <span>${new Date(ann.created_at).toLocaleTimeString()}</span>
                    </div>
                </div>
            </div>
        </div>
    `.trim();

    return card;
}

function createPastCard(ann) {
    const card = document.createElement('div');
    card.className = 'col-lg-6 mb-4';

    card.innerHTML = `
        <div class="announcement-card">
            <span class="announcement-date">${new Date(ann.created_at).toLocaleDateString()}</span>
            <h3 class="announcement-title">${escapeHTML(ann.title)}</h3>
            <p class="announcement-content">${escapeHTML(ann.content)}</p>
            <div class="announcement-image">
                ${createGalleryHTML(ann.images, ann.title)}
            </div>
        </div>
    `.trim();

    return card;
}

/* ==============================================================
   LIGHTBOX + DOWNLOAD LOGIC
   ============================================================== */
document.addEventListener('click', e => {
    // ----- open lightbox -----
    if (e.target.matches('.gallery-img')) {
        const modal   = document.getElementById('imageLightbox');
        const img     = document.getElementById('lightboxImage');
        const dlLink  = document.getElementById('lightboxDownload');

        img.src = e.target.dataset.full;
        dlLink.href = e.target.dataset.download;
        modal.style.display = 'flex';
    }

    // ----- close lightbox -----
    if (e.target.matches('.lightbox-close') || e.target.matches('.lightbox-modal')) {
        document.getElementById('imageLightbox').style.display = 'none';
    }

    // ----- download from thumbnail button -----
    const btn = e.target.closest('.download-btn');
    if (btn) {
        const url = btn.dataset.url;
        const a = document.createElement('a');
        a.href = url;
        a.download = '';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
});

// close with ESC
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') document.getElementById('imageLightbox').style.display = 'none';
});

/* ==============================================================
   EMAIL VALIDATION (unchanged)
   ============================================================== */
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/* ==============================================================
   CSS – put this inside a <style> tag or your CSS file
   ============================================================== */
const style = document.createElement('style');
style.textContent = `
/* Lightbox */
#imageLightbox {display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.9);
    align-items:center;justify-content:center;z-index:9999;padding:20px;}
.lightbox-content {position:relative;max-width:90%;max-height:90%;text-align:center;}
#lightboxImage {max-width:100%;max-height:80vh;border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,.5);}
.lightbox-close {position:absolute;top:-15px;right:-15px;background:#fff;color:#000;width:36px;height:36px;
    border-radius:50%;font-size:24px;font-weight:bold;cursor:pointer;display:flex;align-items:center;
    justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,.3);}
#lightboxDownload {display:inline-flex;align-items:center;gap:8px;margin-top:15px;padding:10px 20px;
    background:#a18cd1;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;
    transition:.3s;}
#lightboxDownload:hover {background:#8b77c7;}

/* Gallery */
.image-gallery {display:flex;gap:8px;margin-bottom:12px;}
.gallery-item {position:relative;flex:1;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1);}
.gallery-item.single {flex:none;width:100%;}
.gallery-img {width:100%;height:120px;object-fit:cover;cursor:zoom-in;transition:transform .3s;}
.gallery-img:hover {transform:scale(1.05);}
.download-btn {position:absolute;bottom:8px;right:8px;background:rgba(161,140,209,.9);color:#fff;
    border:none;width:32px;height:32px;border-radius:50%;cursor:pointer;display:flex;align-items:center;
    justify-content:center;font-size:14px;opacity:0;transition:opacity .3s;}
.gallery-item:hover .download-btn {opacity:1;}
.no-image {background:#f8f9fa;color:#6c757d;text-align:center;padding:40px 20px;font-style:italic;
    border-radius:8px;}
`;
document.head.appendChild(style);

/* ==============================================================
   MODAL HTML – add this once in your page (anywhere in <body>)
   ============================================================== */
if (!document.getElementById('imageLightbox')) {
    const modalHTML = `
        <div id="imageLightbox" class="lightbox-modal">
            <div class="lightbox-content">
                <span class="lightbox-close">×</span>
                <img id="lightboxImage" src="" alt="">
                <a id="lightboxDownload" href="" download class="lightbox-download">
                    <i class="fas fa-download"></i> Download
                </a>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}