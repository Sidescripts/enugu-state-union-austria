// events.js - FULLY FIXED & ENHANCED VERSION
const API_BASE = '/api/v1/e';
let events = [];
let currentImages = [];
let currentVideos = [];
let currentEditEventId = null;

// EDIT MODE: Separate arrays for existing (URLs) and new (File objects)
let editCurrentImages = [];   // URLs already on server
let editCurrentVideos = [];   // URLs already on server
let editNewImages = [];       // New File objects (images)
let editNewVideos = [];       // New File objects (videos)

// DOM Elements
const recentList = document.getElementById('recent-events-list');
const pastList = document.getElementById('past-events-list');
const addForm = document.getElementById('add-event-form');
const mediaInput = document.getElementById('media-files');
const mediaPreview = document.getElementById('media-preview');
const imageCountSpan = document.getElementById('image-count');
const videoCountSpan = document.getElementById('video-count');

// ====================
// UTILITY FUNCTIONS
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

// Generic modal closer
function closeModal(modalId) {
  const overlay = document.getElementById(modalId);
  if (overlay) overlay.classList.remove('active');
}

function clearForm() {
  document.getElementById('event-title').value = '';
  document.getElementById('event-date').value = '';
  document.getElementById('event-description').value = '';
  document.getElementById('event-status').value = 'recent';
  clearMedia();
}

// Redirect after successful signup (call this from signup page)
function redirectAfterSignup() {
  showMessage('Success', 'Account created! Redirecting...');
  setTimeout(() => {
    window.location.href = 'events.html';
  }, 1500);
}

// ====================
// LOAD AND RENDER EVENTS
// ====================
async function loadEvents() {
  console.log('Loading events from API...');
  const headers = getAuthHeaders();
  if (!headers) return;

  try {
    const res = await fetch(`${API_BASE}/all-events`, { headers });
    if (res.status === 401) {
      showMessage('Error', 'Please log in again');
      setTimeout(() => window.location.href = '../index.html', 2000);
      return;
    }
    if (!res.ok) throw new Error('Failed to fetch events');

    const result = await res.json();
    if (result.success) {
      events = result.event || [];
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
  recentList.innerHTML = '';
  pastList.innerHTML = '';

  const recentEvents = events.filter(e => e.status === 'recent');
  const pastEvents = events.filter(e => e.status === 'past');

  if (recentEvents.length === 0) {
    recentList.innerHTML = '<div class="empty-state">No recent events found</div>';
  } else {
    recentEvents.forEach(event => recentList.innerHTML += createEventCard(event));
  }

  if (pastEvents.length === 0) {
    pastList.innerHTML = '<div class="empty-state">No past events found</div>';
  } else {
    pastEvents.forEach(event => pastList.innerHTML += createEventCard(event));
  }

  attachEventListeners();
}

function createEventCard(event) {
  let imageUrl = 'https://via.placeholder.com/300x200?text=No+Image';

  if (event.featuredImage) {
    imageUrl = event.featuredImage;
  } else if (event.images && event.images.length > 0) {
    imageUrl = event.images[0];
  } else if (event.image) {
    imageUrl = event.image;
  }

  if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
    imageUrl = 'https://via.placeholder.com/300x200?text=Invalid+URL';
  }

  const imageCount = event.images ? event.images.length : 0;
  const videoCount = event.videos ? event.videos.length : 0;
  const eventDate = event.date ? new Date(event.date).toLocaleDateString() : 'No date';

  return `
    <div class="content-card" data-id="${event.id}">
      <img src="${imageUrl}" class="content-image" alt="${event.title || 'Event'}"
           onerror="this.onerror=null; this.src='https://via.placeholder.com/300x200.png/cccccc/969696?text=Image+Not+Found'">
      <div class="content-body">
        <h3 class="content-title">${event.title || 'Untitled Event'}</h3>
        <p class="content-description">${event.description || 'No description'}</p>
        <div class="media-badges">
          ${imageCount > 0 ? `<span class="badge badge-images">${imageCount} Photos</span>` : ''}
          ${videoCount > 0 ? `<span class="badge badge-videos">${videoCount} Videos</span>` : ''}
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
}

// ====================
// CARD EVENT LISTENERS
// ====================
function attachEventListeners() {
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      openEditModal(btn.dataset.id);
    });
  });

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      confirmDelete(btn.dataset.id);
    });
  });

  document.querySelectorAll('.content-card').forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => openEventDetails(card.dataset.id));
  });
}

// ====================
// MEDIA UPLOAD (ADD EVENT)
// ====================
function setupMediaUpload() {
  const selectBtn = document.getElementById('select-media-btn');
  const addMoreBtn = document.getElementById('add-more-media');
  const area = document.getElementById('media-upload-area');

  selectBtn.addEventListener('click', () => mediaInput.click());
  addMoreBtn.addEventListener('click', () => mediaInput.click());
  mediaInput.addEventListener('change', handleFileSelect);

  area.addEventListener('dragover', e => { e.preventDefault(); area.classList.add('dragover'); });
  area.addEventListener('dragleave', () => area.classList.remove('dragover'));
  area.addEventListener('drop', e => {
    e.preventDefault();
    area.classList.remove('dragover');
    handleFileSelect({ target: { files: e.dataTransfer.files } });
  });

  updateFileCounts();
}

function handleFileSelect(e) {
  const files = Array.from(e.target.files);
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
  currentImages.forEach((file, i) => {
    const reader = new FileReader();
    reader.onload = e => {
      const div = document.createElement('div');
      div.className = 'file-preview-item';
      div.innerHTML = `
        <img src="${e.target.result}" alt="Preview">
        <button type="button" class="remove-file" data-type="image" data-index="${i}">×</button>
      `;
      mediaPreview.appendChild(div);
      div.querySelector('.remove-file').addEventListener('click', () => {
        currentImages.splice(i, 1);
        updateFilePreview();
        updateFileCounts();
      });
    };
    reader.readAsDataURL(file);
  });

  currentVideos.forEach((file, i) => {
    const reader = new FileReader();
    reader.onload = e => {
      const div = document.createElement('div');
      div.className = 'file-preview-item';
      div.innerHTML = `
        <video src="${e.target.result}" controls></video>
        <button type="button" class="remove-file" data-type="video" data-index="${i}">×</button>
      `;
      mediaPreview.appendChild(div);
      div.querySelector('.remove-file').addEventListener('click', () => {
  currentVideos.splice(i, 1);
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
  const title = document.getElementById('event-title').value.trim();
  const date = document.getElementById('event-date').value;
  const description = document.getElementById('event-description').value.trim();
  const status = document.getElementById('event-status').value;

  if (!title || !date || !description) {
    showMessage('Error', 'Please fill in all required fields');
    return;
  }

  const headers = getAuthHeaders();
  if (!headers) return;

  const formData = new FormData();
  formData.append('title', title);
  formData.append('date', date);
  formData.append('description', description);
  formData.append('status', status);

  currentImages.forEach(img => formData.append('images', img));
  currentVideos.forEach(vid => formData.append('videos', vid));

  try {
    const res = await fetch(`${API_BASE}/create-events`, {
      method: 'POST',
      headers,
      body: formData
    });
    const data = await res.json();

    if (data.success) {
      showMessage('Success', 'Event created successfully!');
      addForm.style.display = 'none';
      clearForm();
      loadEvents();
    } else {
      showMessage('Error', data.message || 'Failed to create event');
    }
  } catch (err) {
    console.error(err);
    showMessage('Error', 'Failed to create event');
  }
}

// ====================
// DELETE EVENT
// ====================
async function confirmDelete(eventId) {
  if (!confirm('Are you sure you want to delete this event?')) return;

  const headers = getAuthHeaders();
  if (!headers) return;

  try {
    const res = await fetch(`${API_BASE}/delete/${eventId}`, {
      method: 'DELETE',
      headers
    });
    const data = await res.json();

    if (data.success) {
      showMessage('Success', 'Event deleted!');
      loadEvents();
    } else {
      showMessage('Error', data.message || 'Delete failed');
    }
  } catch (err) {
    showMessage('Error', 'Delete failed');
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
  } catch (err) {
    showMessage('Error', 'Failed to load event');
  }
}

function populateEditForm(event) {
  document.getElementById('edit-id').value = event.id;
  document.getElementById('edit-title').value = event.title || '';
  document.getElementById('edit-date').value = event.date ? event.date.split('T')[0] : '';
  document.getElementById('edit-description').value = event.description || '';

  const statusSelect = document.getElementById('edit-status');
  if (statusSelect) statusSelect.value = event.status || '';

  // Reset edit arrays
  editCurrentImages = [...(event.images || [])];
  editCurrentVideos = [...(event.videos || [])];
  editNewImages = [];
  editNewVideos = [];

  renderEditMediaPreview();
}

function renderEditMediaPreview() {
  const current = document.getElementById('current-media');
  const preview = document.getElementById('edit-media-preview');
  current.innerHTML = '';
  preview.innerHTML = '';

  // Existing images
  editCurrentImages.forEach((url, i) => {
    const div = document.createElement('div');
    div.className = 'media-item existing-media';
    div.innerHTML = `
      <img src="${url}" alt="Existing">
      <button type="button" class="remove-existing-media" data-type="image" data-index="${i}">×</button>
      <div class="media-label">Existing</div>
    `;
    current.appendChild(div);
  });

  // Existing videos
  editCurrentVideos.forEach((url, i) => {
    const div = document.createElement('div');
    div.className = 'media-item existing-media';
    div.innerHTML = `
      <video src="${url}" controls></video>
      <button type="button" class="remove-existing-media" data-type="video" data-index="${i}">×</button>
      <div class="media-label">Existing</div>
    `;
    current.appendChild(div);
  });

  // New files
  renderNewFilesPreview();
  attachEditMediaListeners();
}

function renderNewFilesPreview() {
  const preview = document.getElementById('edit-media-preview');
  preview.innerHTML = '';

  editNewImages.forEach((file, i) => {
    const reader = new FileReader();
    reader.onload = e => {
      const div = document.createElement('div');
      div.className = 'file-preview-item new-file';
      div.innerHTML = `
        <img src="${e.target.result}" alt="New">
        <button type="button" class="remove-new-file" data-type="image" data-index="${i}">×</button>
        <div class="file-label">New</div>
      `;
      preview.appendChild(div);
    };
    reader.readAsDataURL(file);
  });

  editNewVideos.forEach((file, i) => {
    const reader = new FileReader();
    reader.onload = e => {
      const div = document.createElement('div');
      div.className = 'file-preview-item new-file';
      div.innerHTML = `
        <video src="${e.target.result}" controls></video>
        <button type="button" class="remove-new-file" data-type="video" data-index="${i}">×</button>
        <div class="file-label">New</div>
      `;
      preview.appendChild(div);
    };
    reader.readAsDataURL(file);
  });
}

function attachEditMediaListeners() {
  // Remove existing
  document.querySelectorAll('.remove-existing-media').forEach(btn => {
    btn.onclick = () => {
      const type = btn.dataset.type;
      const i = +btn.dataset.index;
      if (type === 'image') editCurrentImages.splice(i, 1);
      else editCurrentVideos.splice(i, 1);
      renderEditMediaPreview();
    };
  });

  // Remove new
  document.querySelectorAll('.remove-new-file').forEach(btn => {
    btn.onclick = () => {
      const type = btn.dataset.type;
      const i = +btn.dataset.index;
      if (type === 'image') editNewImages.splice(i, 1);
      else editNewVideos.splice(i, 1);
      renderEditMediaPreview();
    };
  });
}

// Setup edit media upload
function setupEditMediaUpload() {
  const input = document.getElementById('edit-media-files');
  const selectBtn = document.getElementById('edit-select-media-btn');
  const addMoreBtn = document.getElementById('edit-add-more-media');
  const area = document.getElementById('edit-media-area');

  selectBtn?.addEventListener('click', () => input.click());
  addMoreBtn?.addEventListener('click', () => input.click());
  input.addEventListener('change', handleEditFileSelect);

  area?.addEventListener('dragover', e => { e.preventDefault(); area.classList.add('dragover'); });
  area?.addEventListener('dragleave', () => area.classList.remove('dragover'));
  area?.addEventListener('drop', e => {
    e.preventDefault();
    area.classList.remove('dragover');
    handleEditFileSelect({ target: { files: e.dataTransfer.files } });
  });
}

function handleEditFileSelect(e) {
  const files = Array.from(e.target.files || []);
  files.forEach(file => {
    const totalImages = editCurrentImages.length + editNewImages.length;
    const totalVideos = editCurrentVideos.length + editNewVideos.length;

    if (file.type.startsWith('image/') && totalImages < 15) {
      editNewImages.push(file);
    } else if (file.type.startsWith('video/') && totalVideos < 3) {
      editNewVideos.push(file);
    }
  });
  renderEditMediaPreview();
  e.target.value = '';
}

async function updateEvent() {
  const id = document.getElementById('edit-id').value;
  const title = document.getElementById('edit-title').value.trim();
  const date = document.getElementById('edit-date').value;
  const desc = document.getElementById('edit-description').value.trim();
  const status = document.getElementById('edit-status').value;

  if (!title || !date || !desc) {
    showMessage('Error', 'Fill all required fields');
    return;
  }

  const headers = getAuthHeaders();
  if (!headers) return;

  const formData = new FormData();
  formData.append('title', title);
  formData.append('date', date);
  formData.append('description', desc);
  if (status) formData.append('status', status);

  // Keep existing URLs
  editCurrentImages.forEach(url => formData.append('images', url));
  editCurrentVideos.forEach(url => formData.append('videos', url));

  // Add new files
  editNewImages.forEach(f => formData.append('images', f));
  editNewVideos.forEach(f => formData.append('videos', f));

  try {
    const res = await fetch(`${API_BASE}/update/${id}`, {
      method: 'PATCH',
      headers,
      body: formData
    });
    const data = await res.json();

    if (data.success) {
      showMessage('Success', 'Event updated!');
      closeModal('editModal');
      loadEvents();
    } else {
      showMessage('Error', data.message || 'Update failed');
    }
  } catch (err) {
    console.error(err);
    showMessage('Error', 'Update failed');
  }
}

// ====================
// EVENT DETAILS MODAL
// ====================
async function openEventDetails(id) {
  const modal = document.getElementById('eventDetailsModal');
  const content = document.getElementById('eventDetailsContent');
  content.innerHTML = `<div class="modal-loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>`;
  modal.classList.add('active');

  try {
    const event = await fetchEventById(id);
    renderEventDetails(event);
  } catch (err) {
    content.innerHTML = `<p>Error loading details.</p>`;
  }
}

async function fetchEventById(id) {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('No auth');
  const res = await fetch(`${API_BASE}/${id}`, { headers });
  if (!res.ok) throw new Error('Not found');
  const data = await res.json();
  if (data.success) return data.data;
  throw new Error(data.message);
}

function renderEventDetails(event) {
  const content = document.getElementById('eventDetailsContent');
  const title = document.getElementById('eventDetailsTitle');
  title.textContent = event.title;

  const date = event.date ? new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'No date';

  content.innerHTML = `
    <div class="event-details">
      <div class="event-details-header">
        <h1 class="event-details-title">${event.title}</h1>
        <div class="event-details-meta">
          <span><i class="fas fa-calendar"></i> ${date}</span>
          <span><i class="fas fa-tag"></i> ${event.status}</span>
        </div>
      </div>
      <div class="event-details-description">${event.description || 'No description'}</div>
      <div class="media-gallery">
        <div class="media-section">
          <h3 class="media-section-title">Images (${event.images?.length || 0})</h3>
          ${renderImagesSection(event.images)}
        </div>
        <div class="media-section">
          <h3 class="media-section-title">Videos (${event.videos?.length || 0})</h3>
          ${renderVideosSection(event.videos)}
        </div>
      </div>
    </div>
  `;
}

function renderImagesSection(images) {
  if (!images?.length) return `<div class="no-media">No images</div>`;
  return `<div class="media-grid">${images.map(url => `
    <div class="media-item" onclick="window.open('${url}', '_blank')">
      <img src="${url}" alt="Image" onerror="this.src='https://via.placeholder.com/200?text=Error'">
    </div>`).join('')}</div>`;
}

function renderVideosSection(videos) {
  if (!videos?.length) return `<div class="no-media">No videos</div>`;
  return `<div class="media-grid">${videos.map((url, i) => `
    <div class="media-item">
      <video controls preload="metadata" id="video-${i}">
        <source src="${url}" type="video/mp4">
      </video>
    </div>`).join('')}</div>`;
}

function closeEventDetailsModal() {
  closeModal('eventDetailsModal');
  document.querySelectorAll('video').forEach(v => v.pause());
}

// ====================
// SETUP LISTENERS
// ====================
function setupEventListeners() {
  // Tabs
  document.querySelectorAll('.content-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.content-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab).classList.add('active');
    });
  });

  // Add event
  document.getElementById('addEventBtn').addEventListener('click', () => {
    addForm.style.display = 'block';
  });

  document.getElementById('cancel-add').addEventListener('click', () => {
    addForm.style.display = 'none';
    clearForm();
  });

  document.getElementById('save-event').addEventListener('click', saveEvent);

  // Message modal
  document.getElementById('closeMessage')?.addEventListener('click', () => closeModal('messageModal'));
  document.getElementById('closeMessageBtn')?.addEventListener('click', () => closeModal('messageModal'));

  // Event details
  document.getElementById('closeEventDetailsModal')?.addEventListener('click', closeEventDetailsModal);
  document.getElementById('closeEventDetails')?.addEventListener('click', closeEventDetailsModal);
  document.getElementById('eventDetailsModal')?.addEventListener('click', e => e.target === e.currentTarget && closeEventDetailsModal());

  // Edit modal
  document.getElementById('updateEvent').addEventListener('click', updateEvent);
  document.getElementById('cancelEdit').addEventListener('click', () => closeModal('editModal'));
  document.getElementById('closeEditModal').addEventListener('click', () => closeModal('editModal'));
  document.getElementById('editModal').addEventListener('click', e => e.target === e.currentTarget && closeModal('editModal'));
}

// ====================
// INIT
// ====================
document.addEventListener('DOMContentLoaded', () => {
  loadEvents();
  setupEventListeners();
  setupMediaUpload();
  setupEditMediaUpload();
});

console.log('Events system initialized');