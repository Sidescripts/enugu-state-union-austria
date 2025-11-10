// events.js - COMPLETE WORKING VERSION WITH EDIT FIXES
const API_BASE = '/api/v1/e';
let events = [];
let currentImages = [];
let currentVideos = [];
let currentEditEventId = null;
let editCurrentImages = [];
let editCurrentVideos = [];
let editNewFiles = []; // Track new files for edit

// DOM Elements
const recentList = document.getElementById('recent-events-list');
const pastList = document.getElementById('past-events-list');
const addForm = document.getElementById('add-event-form');
const mediaInput = document.getElementById('media-files');
const mediaPreview = document.getElementById('media-preview');
const imageCountSpan = document.getElementById('image-count');
const videoCountSpan = document.getElementById('video-count');

// ====================
// REUSABLE BUTTON LOADING
// ====================
function setButtonLoading(button, loading = true) {
  if (!button) return;

  if (loading) {
    // Save original content
    if (!button.dataset.originalHtml) {
      button.dataset.originalHtml = button.innerHTML;
    }
    button.classList.add('btn-loading');
    button.disabled = true;
    button.innerHTML = '<span>Processing...</span>';
  } else {
    // Restore
    button.classList.remove('btn-loading');
    button.disabled = false;
    if (button.dataset.originalHtml) {
      button.innerHTML = button.dataset.originalHtml;
      delete button.dataset.originalHtml;
    }
  }
}

// ====================
// UTILITY FUNCTIONS
// ====================
function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

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
// LOAD AND RENDER EVENTS
// ====================
async function loadEvents() {
  console.log('Loading events from API...');
  
  const headers = getAuthHeaders();
  if (!headers) return;

  try {
    const res = await fetch(`${API_BASE}/all-events`, {
      headers: headers
    });

    if (res.status === 401) {
      showMessage('Error', 'Please log in again');
      setTimeout(() => {
        window.location.href = '../index.html';
      }, 2000);
    }

    if (!res.ok) {
      throw new Error('Failed to fetch events');
    }

    const result = await res.json();
    console.log('API Response:', result);

    if (result.success) {
      events = result.event || [];
      console.log('Loaded events:', events.length);
      renderEvents();
    } else {
      showMessage('Error', result.message || 'Failed to load events');
    }
  } catch (error) {
    console.error('Error loading events:', error);
    showMessage('Error', 'Failed to load events: ' + error.message);
  }
}

function renderEvents() {
  console.log('Rendering events...');
  
  // Clear previous content
  recentList.innerHTML = '';
  pastList.innerHTML = '';

  // Filter events
  const recentEvents = events.filter(event => event.status === 'recent');
  const pastEvents = events.filter(event => event.status === 'past');

  console.log('Recent events:', recentEvents.length);
  console.log('Past events:', pastEvents.length);

  // Render recent events
  if (recentEvents.length === 0) {
    recentList.innerHTML = '<div class="empty-state">No recent events found</div>';
  } else {
    recentEvents.forEach(event => {
      recentList.innerHTML += createEventCard(event);
    });
  }

  // Render past events
  if (pastEvents.length === 0) {
    pastList.innerHTML = '<div class="empty-state">No past events found</div>';
  } else {
    pastEvents.forEach(event => {
      pastList.innerHTML += createEventCard(event);
    });
  }

  // Add event listeners to buttons
  attachEventListeners();
}

function createEventCard(event) {
  console.log('Creating card for event with media:', {
    title: event.title,
    images: event.images,
    videos: event.videos,
    featuredImage: event.featuredImage
  });
  
  // FIXED: Use correct placeholder URL
  let imageUrl = 'https://via.placeholder.com/300x200?text=No+Image';
  
  // Check in order of priority
  if (event.featuredImage) {
    imageUrl = event.featuredImage;
    console.log('Using featuredImage:', imageUrl);
  } else if (event.images && event.images.length > 0 && event.images[0]) {
    imageUrl = event.images[0];
    console.log('Using first image from images array:', imageUrl);
  } else if (event.image) {
    imageUrl = event.image;
    console.log('Using image property:', imageUrl);
  } else {
    console.log('No image found, using placeholder');
  }

  // Ensure the URL is valid for display
  if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
    console.log('Invalid image URL, using placeholder:', imageUrl);
    imageUrl = 'https://via.placeholder.com/300x200?text=Invalid+Image+URL';
  }

  // Get media counts safely
  const imageCount = event.images ? event.images.length : 0;
  const videoCount = event.videos ? event.videos.length : 0;

  // Format date safely
  let eventDate = 'No date';
  try {
    if (event.date) {
      eventDate = new Date(event.date).toLocaleDateString();
    }
  } catch (error) {
    console.log('Error formatting date:', error);
  }

  const cardHTML = `
    <div class="content-card" data-id="${event.id}">
      <img src="${imageUrl}" 
           class="content-image" 
           alt="${event.title || 'Event image'}"
           onerror="this.onerror=null; this.src='https://via.placeholder.com/300x200.png/cccccc/969696?text=Image+Not+Found'">
      <div class="content-body">
        <h3 class="content-title">${event.title || 'Untitled Event'}</h3>
        <p class="content-description">${event.description || 'No description available'}</p>
        
        <!-- Media Count Badges -->
        <div class="media-badges">
          ${imageCount > 0 ? `<span class="badge badge-images">${imageCount} 📷</span>` : ''}
          ${videoCount > 0 ? `<span class="badge badge-videos">${videoCount} 🎥</span>` : ''}
          ${imageCount === 0 && videoCount === 0 ? '<span class="badge badge-no-media">No Media</span>' : ''}
        </div>
        
        <div class="content-meta">
          <span>${eventDate}</span>
          <span>${event.status || 'unknown'}</span>
        </div>
        <div class="content-actions">
          <button class="btn btn-sm btn-primary edit-btn" data-id="${event.id}">Edit</button>
          <button class="btn btn-sm btn-danger delete-btn" data-id="${event.id}">Delete</button>
        </div>
      </div>
    </div>
  `;
  
  return cardHTML;
}
// saveEvent
// ====================
// CARD EVENT LISTENERS
// ====================
function attachEventListeners() {
  // Edit buttons
  document.querySelectorAll('.edit-btn').forEach(button => {
    button.addEventListener('click', function(e) {
      e.stopPropagation(); // Prevent card click when edit button is clicked
      const eventId = this.getAttribute('data-id');
      openEditModal(eventId);
    });
  });

  // Delete buttons
  document.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', function(e) {
      e.stopPropagation(); // Prevent card click when delete button is clicked
      const eventId = this.getAttribute('data-id');
      confirmDelete(eventId);
    });
  });

  // Make entire card clickable for details view
  document.querySelectorAll('.content-card').forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', function() {
      const eventId = this.getAttribute('data-id');
      openEventDetails(eventId);
    });
  });
}

// ====================
// MEDIA UPLOAD HANDLING
// ====================
function setupMediaUpload() {
  const selectMediaBtn = document.getElementById('select-media-btn');
  const addMoreMediaBtn = document.getElementById('add-more-media');
  const mediaArea = document.getElementById('media-upload-area');

  // Click handlers
  selectMediaBtn.addEventListener('click', () => mediaInput.click());
  addMoreMediaBtn.addEventListener('click', () => mediaInput.click());

  // File input change
  mediaInput.addEventListener('change', handleFileSelect);

  // Drag and drop
  mediaArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    mediaArea.classList.add('dragover');
  });

  mediaArea.addEventListener('dragleave', () => {
    mediaArea.classList.remove('dragover');
  });

  mediaArea.addEventListener('drop', (e) => {
    e.preventDefault();
    mediaArea.classList.remove('dragover');
    handleFileSelect({ target: { files: e.dataTransfer.files } });
  });

  updateFileCounts();
}

function handleFileSelect(event) {
  const files = Array.from(event.target.files);
  
  files.forEach(file => {
    if (file.type.startsWith('image/') && currentImages.length < 15) {
      currentImages.push(file);
    } else if (file.type.startsWith('video/') && currentVideos.length < 3) {
      currentVideos.push(file);
    }
  });

  updateFilePreview();
  updateFileCounts();
}

function updateFilePreview() {
  mediaPreview.innerHTML = '';

  // Show images
  currentImages.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const div = document.createElement('div');
      div.className = 'file-preview-item';
      div.innerHTML = `
        <img src="${e.target.result}" alt="Preview">
        <button type="button" class="remove-file" data-type="image" data-index="${index}">×</button>
      `;
      mediaPreview.appendChild(div);

      // Add remove event listener
      div.querySelector('.remove-file').addEventListener('click', function() {
        currentImages.splice(index, 1);
        updateFilePreview();
        updateFileCounts();
      });
    };
    reader.readAsDataURL(file);
  });

  // Show videos
  currentVideos.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const div = document.createElement('div');
      div.className = 'file-preview-item';
      div.innerHTML = `
        <video src="${e.target.result}" controls></video>
        <button type="button" class="remove-file" data-type="video" data-index="${index}">×</button>
      `;
      mediaPreview.appendChild(div);

      // Add remove event listener
      div.querySelector('.remove-file').addEventListener('click', function() {
        currentVideos.splice(index, 1);
        updateFilePreview();
        updateFileCounts();
      });
    };
    reader.readAsDataURL(file);
  });
}

function updateFileCounts() {
  if (imageCountSpan) imageCountSpan.textContent = currentImages.length;
  if (videoCountSpan) videoCountSpan.textContent = currentVideos.length;
}

function clearMedia() {
  currentImages = [];
  currentVideos = [];
  mediaPreview.innerHTML = '';
  updateFileCounts();
}

// ====================
// CREATE EVENT
// ====================
async function saveEvent() {
  const saveBtn = document.getElementById('save-event');
  setButtonLoading(saveBtn, true);

  const title = document.getElementById('event-title').value.trim();
  const date = document.getElementById('event-date').value;
  const description = document.getElementById('event-description').value.trim();
  const status = document.getElementById('event-status').value;

  // Validation
  if (!title || !date || !description) {
    showMessage('Error', 'Please fill in all required fields');
    setButtonLoading(saveBtn, false);
    return;
  }

  const headers = getAuthHeaders();
  if (!headers) { setButtonLoading(saveBtn, false); return; }

  // Create FormData
  const formData = new FormData();
  formData.append('title', title);
  formData.append('date', date);
  formData.append('description', description);
  formData.append('status', status);

  // Add images
  currentImages.forEach(image => {
    formData.append('images', image);
  });

  // Add videos
  currentVideos.forEach(video => {
    formData.append('videos', video);
  });

  try {
    const response = await fetch(`${API_BASE}/create-events`, {
      method: 'POST',
      headers: headers,
      body: formData
    });

    const result = await response.json();
    console.log('Create event response:', result);

    if (result.success) {
      showMessage('Success', 'Event created successfully!');
      // Hide form and reset
      addForm.style.display = 'none';
      clearForm();
      // Reload events
      loadEvents();
    } else {
      showMessage('Error', result.message || 'Failed to create event');
    }
  } catch (error) {
    console.error('Error creating event:', error);
    showMessage('Error', 'Failed to create event: ' + error.message);
    setButtonLoading(saveBtn, false);
  }
}

// ====================
// DELETE EVENT
// ====================
async function confirmDelete(eventId) {
  const confirmDelete = window.confirm('Are you sure you want to delete this event?');
  if (!confirmDelete) return;
  const confirmBtn = document.getElementById('confirmAction');
  setButtonLoading(confirmBtn, true);

  const headers = getAuthHeaders();
  if (!headers) { setButtonLoading(confirmBtn, false); return; }


  try {
    const response = await fetch(`${API_BASE}/delete/${eventId}`, {
      method: 'DELETE',
      headers: headers
    });

    const result = await response.json();
    
    if (result.success) {
      showMessage('Success', 'Event deleted successfully!');
      closeModal('confirmationModal');
      loadEvents(); // Reload the events list
    } else {
      showMessage('Error', result.message || 'Failed to delete event');
    }
  } catch (error) {
    console.error('Error deleting event:', error);
    setButtonLoading(confirmBtn, false);
    showMessage('Error', 'Failed to delete event: ' + error.message);
  }
}

// ====================
// EDIT EVENT
// ====================
async function openEditModal(eventId) {
  currentEditEventId = eventId;
  
  try {
    const event = await fetchEventById(eventId);
    populateEditForm(event);
    document.getElementById('editModal').classList.add('active');
  } catch (error) {
    console.error('Error opening edit modal:', error);
    showMessage('Error', 'Failed to load event for editing');
  }
}

function populateEditForm(event) {
  console.log('Populating edit form with:', event);
  
  // Reset edit media arrays
  editCurrentImages = [...(event.images || [])];
  editCurrentVideos = [...(event.videos || [])];
  editNewFiles = []; // Reset new files
  
  // Populate form fields
  document.getElementById('edit-id').value = event.id;
  document.getElementById('edit-title').value = event.title || '';
  document.getElementById('edit-date').value = event.date ? event.date.split('T')[0] : '';
  document.getElementById('edit-description').value = event.description || '';
  
  const statusSelect = document.getElementById('edit-status');
  if (statusSelect) {
    statusSelect.value = event.status || '';
  }
  
  // Render current media
  renderEditMediaPreview();
}

function renderEditMediaPreview() {
  const currentMediaContainer = document.getElementById('current-media');
  const editMediaPreview = document.getElementById('edit-media-preview');
  
  // Clear existing content
  currentMediaContainer.innerHTML = '';
  editMediaPreview.innerHTML = '';
  
  // Render existing images
  editCurrentImages.forEach((imageUrl, index) => {
    const mediaItem = document.createElement('div');
    mediaItem.className = 'media-item existing-media';
    mediaItem.innerHTML = `
      <img src="${imageUrl}" alt="Existing image ${index + 1}" class="media-image">
      <button type="button" class="remove-existing-media" data-type="image" data-index="${index}">×</button>
      <div class="media-label">Existing</div>
    `;
    currentMediaContainer.appendChild(mediaItem);
  });
  
  // Render existing videos
  editCurrentVideos.forEach((videoUrl, index) => {
    const mediaItem = document.createElement('div');
    mediaItem.className = 'media-item existing-media';
    mediaItem.innerHTML = `
      <video src="${videoUrl}" class="media-image" controls></video>
      <button type="button" class="remove-existing-media" data-type="video" data-index="${index}">×</button>
      <div class="media-label">Existing</div>
    `;
    currentMediaContainer.appendChild(mediaItem);
  });
  
  // Render new files preview
  renderNewFilesPreview();
  
  // Add event listeners for remove buttons
  attachEditMediaListeners();
}

function renderNewFilesPreview() {
  const editMediaPreview = document.getElementById('edit-media-preview');
  editMediaPreview.innerHTML = '';
  
  // Render new files
  editNewFiles.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const div = document.createElement('div');
      div.className = 'file-preview-item new-file';
      div.setAttribute('data-file-index', index);
      
      if (file.type.startsWith('image/')) {
        div.innerHTML = `
          <img src="${e.target.result}" alt="New image preview">
          <button type="button" class="remove-new-file" data-file-index="${index}">×</button>
          <div class="file-label">New</div>
        `;
      } else if (file.type.startsWith('video/')) {
        div.innerHTML = `
          <video src="${e.target.result}" controls></video>
          <button type="button" class="remove-new-file" data-file-index="${index}">×</button>
          <div class="file-label">New</div>
        `;
      }
      
      editMediaPreview.appendChild(div);
      
      // Add remove listener for new files
      div.querySelector('.remove-new-file').addEventListener('click', function() {
        const fileIndex = parseInt(this.getAttribute('data-file-index'));
        editNewFiles.splice(fileIndex, 1);
        renderNewFilesPreview(); // Re-render to update indices
      });
    };
    reader.readAsDataURL(file);
  });
}

function attachEditMediaListeners() {
  // Remove existing media
  document.querySelectorAll('.remove-existing-media').forEach(button => {
    button.addEventListener('click', function() {
      const type = this.getAttribute('data-type');
      const index = parseInt(this.getAttribute('data-index'));
      
      if (type === 'image') {
        editCurrentImages.splice(index, 1);
      } else if (type === 'video') {
        editCurrentVideos.splice(index, 1);
      }
      
      renderEditMediaPreview();
    });
  });
}

// Setup edit media upload
function setupEditMediaUpload() {
  const editMediaInput = document.getElementById('edit-media-files');
  const editSelectBtn = document.getElementById('edit-select-media-btn');
  const editAddMoreBtn = document.getElementById('edit-add-more-media');
  const editMediaArea = document.getElementById('edit-media-area');
  
  if (!editMediaInput) return;
  
  editSelectBtn?.addEventListener('click', () => editMediaInput.click());
  editAddMoreBtn?.addEventListener('click', () => editMediaInput.click());
  
  editMediaInput.addEventListener('change', handleEditFileSelect);
  
  // Drag and drop for edit modal
  editMediaArea?.addEventListener('dragover', (e) => {
    e.preventDefault();
    editMediaArea.classList.add('dragover');
  });
  
  editMediaArea?.addEventListener('dragleave', () => {
    editMediaArea.classList.remove('dragover');
  });
  
  editMediaArea?.addEventListener('drop', (e) => {
    e.preventDefault();
    editMediaArea.classList.remove('dragover');
    handleEditFileSelect({ target: { files: e.dataTransfer.files } });
  });
}

function handleEditFileSelect(event) {
  const files = Array.from(event.target.files);
  
  files.forEach(file => {
    // Check limits before adding
    const currentImageCount = editCurrentImages.length + editNewFiles.filter(f => f.type.startsWith('image/')).length;
    const currentVideoCount = editCurrentVideos.length + editNewFiles.filter(f => f.type.startsWith('video/')).length;
    
    if (file.type.startsWith('image/') && currentImageCount >= 15) {
      showMessage('Limit Reached', 'Maximum 15 images allowed');
      return;
    }
    if (file.type.startsWith('video/') && currentVideoCount >= 3) {
      showMessage('Limit Reached', 'Maximum 3 videos allowed');
      return;
    }
    
    // Add to new files array
    editNewFiles.push(file);
  });
  
  // Re-render preview to show new files
  renderNewFilesPreview();
  
  // Clear the file input
  event.target.value = '';
}

async function updateEvent() {
  const eventId = document.getElementById('edit-id').value;
  const title = document.getElementById('edit-title').value.trim();
  const date = document.getElementById('edit-date').value;
  const description = document.getElementById('edit-description').value.trim();
  const status = document.getElementById('edit-status').value;

  // Validation
  if (!title || !date || !description) {
    showMessage('Error', 'Please fill in all required fields');
    return;
  }

  const headers = getAuthHeaders();
  if (!headers) return;

  // Create FormData
  const formData = new FormData();
  formData.append('title', title);
  formData.append('date', date);
  formData.append('description', description);
  if (status) formData.append('status', status);

  // Add existing images and videos as strings
  editCurrentImages.forEach(imageUrl => {
    formData.append('images', imageUrl);
  });
  
  editCurrentVideos.forEach(videoUrl => {
    formData.append('videos', videoUrl);
  });

  // Add NEW files as File objects
  editNewFiles.forEach(file => {
    const field = file.type.startsWith('image/') ? 'images' : 'videos';
    formData.append(field, file);
  });

  console.log('Update FormData contents:');
  for (let [key, value] of formData.entries()) {
    console.log(key + ': ', value);
  }

  try {
    const response = await fetch(`${API_BASE}/update/${eventId}`, {
      method: 'PATCH',
      headers: headers,
      body: formData
    });

    const result = await response.json();
    console.log('Update event response:', result);

    if (result.success) {
      showMessage('Success', 'Event updated successfully!');
      closeModal('editModal');
      // Reset edit state
      editNewFiles = [];
      editCurrentImages = [];
      editCurrentVideos = [];
      loadEvents(); // Reload events to show changes
    } else {
      showMessage('Error', result.message || 'Failed to update event');
    }
  } catch (error) {
    console.error('Error updating event:', error);
    showMessage('Error', 'Failed to update event: ' + error.message);
  }
}

// ====================
// EVENT DETAILS MODAL
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
          <video class="media-video" preload="metadata" id="video-${index}" controls controlsList="nodownload">
            <source src="${videoUrl}" type="video/mp4">
            Your browser does not support the video tag.
          </video>
          <div class="video-controls">
            <button class="play-button" onclick="toggleVideoPlay(${index})">
              <i class="fas fa-play"></i>
            </button>
          </div>
          <div class="video-fallback">
            <p>If video doesn't play, <a href="${videoUrl}" target="_blank" rel="noopener">click here to open in new tab</a></p>
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
  // Tab switching
  document.querySelectorAll('.content-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      // Remove active class from all tabs and contents
      document.querySelectorAll('.content-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      // Add active class to clicked tab and corresponding content
      this.classList.add('active');
      const tabId = this.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });

  // Add event button
  document.getElementById('addEventBtn').addEventListener('click', function() {
    addForm.style.display = 'block';
  });

  // Cancel add button
  document.getElementById('cancel-add').addEventListener('click', function() {
    addForm.style.display = 'none';
    clearForm();
  });

  // Save event button
  document.getElementById('save-event').addEventListener('click', saveEvent);

  // Modal close buttons
  document.getElementById('closeMessage').addEventListener('click', function() {
    closeModal('messageModal');
  });

  document.getElementById('closeMessageBtn').addEventListener('click', function() {
    closeModal('messageModal');
  });

  // EVENT DETAILS MODAL LISTENERS
  document.getElementById('closeEventDetailsModal').addEventListener('click', closeEventDetailsModal);
  document.getElementById('closeEventDetails').addEventListener('click', closeEventDetailsModal);
  
  // Close modal when clicking overlay
  document.getElementById('eventDetailsModal').addEventListener('click', function(e) {
    if (e.target === this) {
      closeEventDetailsModal();
    }
  });

  // Edit modal listeners
  document.getElementById('updateEvent').addEventListener('click', updateEvent);
  document.getElementById('cancelEdit').addEventListener('click', () => closeModal('editModal'));
  document.getElementById('closeEditModal').addEventListener('click', () => closeModal('editModal'));
  
  // Close edit modal when clicking overlay
  document.getElementById('editModal').addEventListener('click', function(e) {
    if (e.target === this) {
      closeModal('editModal');
    }
  });

  // Delete confirmation modal listeners
  document.getElementById('closeConfirmationModal').addEventListener('click', () => closeModal('confirmationModal'));
  document.getElementById('cancelAction').addEventListener('click', () => closeModal('confirmationModal'));
}

// ====================
// INITIALIZATION
// ====================
document.addEventListener('DOMContentLoaded', function() {
  console.log('Page loaded - initializing events...');
  loadEvents();
  setupEventListeners();
  setupMediaUpload();
  setupEditMediaUpload();
});

console.log('Events management system initialized');