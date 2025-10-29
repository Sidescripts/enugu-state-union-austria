// ====================
// UTILITY FUNCTIONS (put these first)
// ====================
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  if (!token) {
    showMessage('Error', 'Please log in again');
    setTimeout(() => {
      window.location.href = '../index.html';
    }, 2000);
    return null;
  }
  return {
    'Authorization': `Bearer ${token}`
  };
}

function showMessage(title, message) {
  const messageTitle = document.getElementById('messageTitle');
  const messageText = document.getElementById('messageText');
  
  if (messageTitle && messageText) {
    messageTitle.textContent = title;
    messageText.textContent = message;
    document.getElementById('messageModal').classList.add('active');
  } else {
    alert(`${title}: ${message}`);
  }
}

function clearForm() {
  document.getElementById('event-title').value = '';
  document.getElementById('event-date').value = '';
  document.getElementById('event-description').value = '';
  document.getElementById('event-status').value = 'recent';
  clearMedia();
}

// ====================
// MEDIA UPLOAD HANDLING
// ====================
function setupMediaUpload() {
  // ... your existing media upload code ...
}

function handleFileSelect(event) {
  // ... your existing code ...
}

function updateFilePreview() {
  // ... your existing code ...
}

function updateFileCounts() {
  // ... your existing code ...
}

function clearMedia() {
  // ... your existing code ...
}

// ====================
// EVENT CRUD OPERATIONS
// ====================
async function saveEvent() {
  // ... your existing code ...
}

async function confirmDelete(eventId) {
  // ... your existing code ...
}

function openEditModal(eventId) {
  showMessage('Info', 'Edit functionality coming soon for event ID: ' + eventId);
}

// ====================
// EVENT DETAILS MODAL (NEW)
// ====================
async function openEventDetails(eventId) {
  console.log('Opening event details for:', eventId);
  
  const modal = document.getElementById('eventDetailsModal');
  const content = document.getElementById('eventDetailsContent');
  
  // Show loading state
  content.innerHTML = `
    <div class="modal-loading">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Loading event details...</p>
    </div>
  `;
  
  modal.classList.add('active');

  try {
    const event = await fetchEventById(eventId);
    renderEventDetails(event);
  } catch (error) {
    console.error('Error loading event details:', error);
    content.innerHTML = `
      <div class="modal-loading">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Error loading event details. Please try again.</p>
      </div>
    `;
  }
}

async function fetchEventById(eventId) {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Authentication failed');

  const response = await fetch(`${API_BASE}/${eventId}`, {
    headers: headers
  });

  if (!response.ok) {
    throw new Error('Failed to fetch event');
  }

  const result = await response.json();
  
  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.message || 'Event not found');
  }
}

function renderEventDetails(event) {
  console.log('Rendering event details:', event);
  
  const content = document.getElementById('eventDetailsContent');
  const title = document.getElementById('eventDetailsTitle');
  
  // Update modal title
  title.textContent = event.title || 'Event Details';
  
  // Format date
  const eventDate = event.date ? new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'Date not specified';

  // Create HTML for event details
  content.innerHTML = `
    <div class="event-details">
      <div class="event-details-header">
        <h1 class="event-details-title">${event.title || 'Untitled Event'}</h1>
        <div class="event-details-meta">
          <span><i class="fas fa-calendar"></i> ${eventDate}</span>
          <span><i class="fas fa-tag"></i> ${event.status || 'No status'}</span>
        </div>
      </div>
      
      <div class="event-details-description">
        ${event.description || 'No description available.'}
      </div>
      
      <div class="media-gallery">
        <!-- Images Section -->
        <div class="media-section">
          <h3 class="media-section-title">
            <i class="fas fa-images"></i>
            Images (${event.images ? event.images.length : 0})
          </h3>
          ${renderImagesSection(event.images)}
        </div>
        
        <!-- Videos Section -->
        <div class="media-section">
          <h3 class="media-section-title">
            <i class="fas fa-video"></i>
            Videos (${event.videos ? event.videos.length : 0})
          </h3>
          ${renderVideosSection(event.videos)}
        </div>
      </div>
    </div>
  `;

  // Attach video play functionality
  attachVideoListeners();
}

function renderImagesSection(images) {
  if (!images || images.length === 0) {
    return `
      <div class="no-media">
        <i class="fas fa-images"></i>
        <p>No images available for this event</p>
      </div>
    `;
  }

  return `
    <div class="media-grid images-grid">
      ${images.map((imageUrl, index) => `
        <div class="media-item" onclick="openImageLightbox('${imageUrl}', ${index})">
          <img src="${imageUrl}" alt="Event image ${index + 1}" class="media-image"
               onerror="this.src='https://via.placeholder.com/200x150?text=Image+Error'">
        </div>
      `).join('')}
    </div>
  `;
}

function renderVideosSection(videos) {
  if (!videos || videos.length === 0) {
    return `
      <div class="no-media">
        <i class="fas fa-video"></i>
        <p>No videos available for this event</p>
      </div>
    `;
  }

  return `
    <div class="media-grid videos-grid">
      ${videos.map((videoUrl, index) => `
        <div class="media-item">
          <video class="media-video" preload="metadata" id="video-${index}">
            <source src="${videoUrl}" type="video/mp4">
            Your browser does not support the video tag.
          </video>
          <div class="video-controls">
            <button class="play-button" onclick="toggleVideoPlay(${index})">
              <i class="fas fa-play"></i>
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function toggleVideoPlay(videoIndex) {
  const video = document.getElementById(`video-${videoIndex}`);
  const playButton = video.parentElement.querySelector('.play-button i');
  
  if (video.paused) {
    video.play();
    playButton.className = 'fas fa-pause';
  } else {
    video.pause();
    playButton.className = 'fas fa-play';
  }
}

function attachVideoListeners() {
  // Update play button when video ends
  document.querySelectorAll('.media-video').forEach(video => {
    video.addEventListener('ended', function() {
      const playButton = this.parentElement.querySelector('.play-button i');
      playButton.className = 'fas fa-play';
    });
    
    video.addEventListener('play', function() {
      const playButton = this.parentElement.querySelector('.play-button i');
      playButton.className = 'fas fa-pause';
    });
    
    video.addEventListener('pause', function() {
      const playButton = this.parentElement.querySelector('.play-button i');
      playButton.className = 'fas fa-play';
    });
  });
}

function openImageLightbox(imageUrl, index) {
  window.open(imageUrl, '_blank');
}

function closeEventDetailsModal() {
  document.getElementById('eventDetailsModal').classList.remove('active');
  
  // Pause all videos when modal closes
  document.querySelectorAll('.media-video').forEach(video => {
    video.pause();
    video.currentTime = 0;
  });
}

// ====================
// EVENT LISTENERS SETUP
// ====================
function setupEventListeners() {
  // ... the updated version from above ...
}

// ====================
// CARD EVENT LISTENERS
// ====================
function attachEventListeners() {
  // ... the single version from above ...
}

// ====================
// INITIALIZATION
// ====================
document.addEventListener('DOMContentLoaded', function() {
  console.log('Page loaded - initializing events...');
  loadEvents();
  setupEventListeners();
  setupMediaUpload();
});

console.log('Events management system initialized');