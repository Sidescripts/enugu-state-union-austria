// events.js - FULLY UPDATED WITH BUTTON LOADING STATES (Nov 10, 2025)
const API_BASE = '/api/v1/e';
let events = [];
let currentImages = [];
let currentVideos = [];
let currentEditEventId = null;
let editCurrentImages = [];
let editCurrentVideos = [];
let editNewFiles = [];

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
    setTimeout(() => window.location.href = '../index.html', 2000);
    return null;
  }
  return { 'Authorization': `Bearer ${token}` };
}

function showMessage(title, message) {
  const messageTitle = document.getElementById('messageTitle');
  const messageText = document.getElementById('messageText');
  messageTitle.textContent = title;
  messageText.textContent = message;
  document.getElementById('messageModal').classList.add('active');
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
  const headers = getAuthHeaders();
  if (!headers) return;

  try {
    const res = await fetch(`${API_BASE}/all-events`, { headers });
    if (res.status === 401) {
      showMessage('Error', 'Session expired. Redirecting...');
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
    console.error('Load events error:', error);
    showMessage('Error', 'Network error. Please check your connection.');
  }
}

function renderEvents() {
  const recentList = document.getElementById('recent-events-list');
  const pastList = document.getElementById('past-events-list');
  recentList.innerHTML = '';
  pastList.innerHTML = '';

  const recentEvents = events.filter(e => e.status === 'recent');
  const pastEvents = events.filter(e => e.status === 'past');

  if (recentEvents.length === 0) recentList.innerHTML = '<div class="empty-state">No recent events</div>';
  else recentEvents.forEach(event => recentList.innerHTML += createEventCard(event));

  if (pastEvents.length === 0) pastList.innerHTML = '<div class="empty-state">No past events</div>';
  else pastEvents.forEach(event => pastList.innerHTML += createEventCard(event));

  attachEventListeners();
}

function createEventCard(event) {
  let imageUrl = 'https://via.placeholder.com/300x200?text=No+Image';
  if (event.featuredImage) imageUrl = event.featuredImage;
  else if (event.images?.[0]) imageUrl = event.images[0];
  else if (event.image) imageUrl = event.image;

  const imgCount = event.images ? event.images.length : 0;
  const vidCount = event.videos ? event.videos.length : 0;
  const dateStr = event.date ? new Date(event.date).toLocaleDateString() : 'No date';

  return `
    <div class="content-card" data-id="${event.id}">
      <img src="${imageUrl}" class="content-image" alt="${event.title}"
           onerror="this.src='https://via.placeholder.com/300x200.png/cccccc/666666?text=Image+Missing'">
      <div class="content-body">
        <h3 class="content-title">${event.title || 'Untitled'}</h3>
        <p class="content-description">${event.description || 'No description'}</p>
        <div class="media-badges">
          ${imgCount > 0 ? `<span class="badge badge-images">${imgCount} Photos</span>` : ''}
          ${vidCount > 0 ? `<span class="badge badge-videos">${vidCount} Videos</span>` : ''}
          ${imgCount === 0 && vidCount === 0 ? '<span class="badge badge-no-media">No Media</span>' : ''}
        </div>
        <div class="content-meta">
          <span>${dateStr}</span>
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

function attachEventListeners() {
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      openEditModal(btn.dataset.id);
    };
  });

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      confirmDelete(btn.dataset.id);
    };
  });

  document.querySelectorAll('.content-card').forEach(card => {
    card.onclick = () => openEventDetails(card.dataset.id);
  });
}

// ====================
// MEDIA HANDLING
// ====================
function setupMediaUpload() {
  const input = document.getElementById('media-files');
  const area = document.getElementById('media-upload-area');
  ['select-media-btn', 'add-more-media'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => input.click());
  });

  input.onchange = handleFileSelect;
  area.ondragover = e => { e.preventDefault(); area.classList.add('dragover'); };
  area.ondragleave = () => area.classList.remove('dragover');
  area.ondrop = e => {
    e.preventDefault();
    area.classList.remove('dragover');
    handleFileSelect({ target: { files: e.dataTransfer.files } });
  };

  updateFileCounts();
}

function handleFileSelect(e) {
  const files = Array.from(e.target.files);
  files.forEach(file => {
    if (file.type.startsWith('image/') && currentImages.length < 15) currentImages.push(file);
    if (file.type.startsWith('video/') && currentVideos.length < 3) currentVideos.push(file);
  });
  updateFilePreview();
  updateFileCounts();
}

function updateFilePreview() {
  const preview = document.getElementById('media-preview');
  preview.innerHTML = '';

  [...currentImages, ...currentVideos].forEach((file, i) => {
    const reader = new FileReader();
    reader.onload = ev => {
      const div = document.createElement('div');
      div.className = 'file-preview-item';
      const isVideo = file.type.startsWith('video/');
      const index = isVideo ? currentVideos.indexOf(file) : currentImages.indexOf(file);
      const type = isVideo ? 'video' : 'image';

      div.innerHTML = `
        ${isVideo ? `<video src="${ev.target.result}" controls></video>` : `<img src="${ev.target.result}">`}
        <button type="button" class="remove-file" data-type="${type}" data-index="${index}">×</button>
      `;
      preview.appendChild(div);
      div.querySelector('.remove-file').onclick = () => {
        if (type === 'image') currentImages.splice(index, 1);
        else currentVideos.splice(index, 1);
        updateFilePreview();
        updateFileCounts();
      };
    };
    reader.readAsDataURL(file);
  });
}

function updateFileCounts() {
  document.getElementById('image-count').textContent = currentImages.length;
  document.getElementById('video-count').textContent = currentVideos.length;
}

function clearMedia() {
  currentImages = [];
  currentVideos = [];
  document.getElementById('media-preview').innerHTML = '';
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
  const desc = document.getElementById('event-description').value.trim();
  const status = document.getElementById('event-status').value;

  if (!title || !date || !desc) {
    showMessage('Error', 'Please fill all required fields');
    setButtonLoading(saveBtn, false);
    return;
  }

  const headers = getAuthHeaders();
  if (!headers) { setButtonLoading(saveBtn, false); return; }

  const formData = new FormData();
  formData.append('title', title);
  formData.append('date', date);
  formData.append('description', desc);
  formData.append('status', status);
  currentImages.forEach(f => formData.append('images', f));
  currentVideos.forEach(f => formData.append('videos', f));

  try {
    const res = await fetch(`${API_BASE}/create-events`, {
      method: 'POST',
      headers: headers,
      body: formData
    });
    const result = await res.json();

    if (result.success) {
      showMessage('Success', 'Event created successfully!');
      document.getElementById('add-event-form').style.display = 'none';
      clearForm();
      loadEvents();
    } else {
      showMessage('Error', result.message || 'Failed to create event');
    }
  } catch (err) {
    console.error(err);
    showMessage('Error', 'Network error. Try again.');
  } finally {
    setButtonLoading(saveBtn, false);
  }
}

// ====================
// DELETE EVENT
// ====================
async function confirmDelete(eventId) {
  const confirmBtn = document.getElementById('confirmAction');
  setButtonLoading(confirmBtn, true);

  const headers = getAuthHeaders();
  if (!headers) { setButtonLoading(confirmBtn, false); return; }

  try {
    const res = await fetch(`${API_BASE}/delete/${eventId}`, {
      method: 'DELETE',
      headers: headers
    });
    const result = await res.json();

    if (result.success) {
      showMessage('Success', 'Event deleted!');
      closeModal('confirmationModal');
      loadEvents();
    } else {
      showMessage('Error', result.message || 'Delete failed');
    }
  } catch (err) {
    showMessage('Error', 'Network error');
  } finally {
    setButtonLoading(confirmBtn, false);
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
  editCurrentImages = [...(event.images || [])];
  editCurrentVideos = [...(event.videos || [])];
  editNewFiles = [];

  document.getElementById('edit-id').value = event.id;
  document.getElementById('edit-title').value = event.title || '';
  document.getElementById('edit-date').value = event.date ? event.date.split('T')[0] : '';
  document.getElementById('edit-description').value = event.description || '';
  document.getElementById('edit-status').value = event.status || '';

  renderEditMediaPreview();
}

function renderEditMediaPreview() {
  const current = document.getElementById('current-media');
  const preview = document.getElementById('edit-media-preview');
  current.innerHTML = '';
  preview.innerHTML = '';

  editCurrentImages.forEach((url, i) => {
    current.innerHTML += `
      <div class="media-item existing-media">
        <img src="${url}" class="media-image">
        <button type="button" class="remove-existing-media" data-type="image" data-index="${i}">×</button>
        <div class="media-label">Existing</div>
      </div>
    `;
  });

  editCurrentVideos.forEach((url, i) => {
    current.innerHTML += `
      <div class="media-item existing-media">
        <video src="${url}" controls class="media-image"></video>
        <button type="button" class="remove-existing-media" data-type="video" data-index="${i}">×</button>
        <div class="media-label">Existing</div>
      </div>
    `;
  });

  renderNewFilesPreview();
  attachEditMediaListeners();
}

function renderNewFilesPreview() {
  const preview = document.getElementById('edit-media-preview');
  preview.innerHTML = '';
  editNewFiles.forEach((file, i) => {
    const reader = new FileReader();
    reader.onload = e => {
      preview.innerHTML += `
        <div class="file-preview-item new-file">
          ${file.type.startsWith('image/') ? `<img src="${e.target.result}">` : `<video src="${e.target.result}" controls></video>`}
          <button type="button" class="remove-new-file" data-index="${i}">×</button>
          <div class="file-label">New</div>
        </div>
      `;
      document.querySelectorAll('.remove-new-file').forEach(btn => {
        btn.onclick = () => {
          editNewFiles.splice(btn.dataset.index, 1);
          renderNewFilesPreview();
        };
      });
    };
    reader.readAsDataURL(file);
  });
}

function attachEditMediaListeners() {
  document.querySelectorAll('.remove-existing-media').forEach(btn => {
    btn.onclick = () => {
      const type = btn.dataset.type;
      const index = parseInt(btn.dataset.index);
      if (type === 'image') editCurrentImages.splice(index, 1);
      else editCurrentVideos.splice(index, 1);
      renderEditMediaPreview();
    };
  });
}

function setupEditMediaUpload() {
  const input = document.getElementById('edit-media-files');
  const area = document.getElementById('edit-media-area');
  ['edit-select-media-btn', 'edit-add-more-media'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => input.click());
  });

  input.onchange = e => handleEditFileSelect(e);
  area.ondragover = e => { e.preventDefault(); area.classList.add('dragover'); };
  area.ondragleave = () => area.classList.remove('dragover');
  area.ondrop = e => {
    e.preventDefault();
    area.classList.remove('dragover');
    handleEditFileSelect({ target: { files: e.dataTransfer.files } });
  };
}

function handleEditFileSelect(e) {
  const files = Array.from(e.target.files);
  files.forEach(file => {
    const totalImages = editCurrentImages.length + editNewFiles.filter(f => f.type.startsWith('image/')).length;
    const totalVideos = editCurrentVideos.length + editNewFiles.filter(f => f.type.startsWith('video/')).length;

    if (file.type.startsWith('image/') && totalImages >= 15) {
      showMessage('Limit', 'Max 15 images allowed');
      return;
    }
    if (file.type.startsWith('video/') && totalVideos >= 3) {
      showMessage('Limit', 'Max 3 videos allowed');
      return;
    }
    editNewFiles.push(file);
  });
  renderNewFilesPreview();
  e.target.value = '';
}

async function updateEvent() {
  const updateBtn = document.getElementById('updateEvent');
  setButtonLoading(updateBtn, true);

  const id = document.getElementById('edit-id').value;
  const title = document.getElementById('edit-title').value.trim();
  const date = document.getElementById('edit-date').value;
  const desc = document.getElementById('edit-description').value.trim();
  const status = document.getElementById('edit-status').value;

  if (!title || !date || !desc) {
    showMessage('Error', 'Fill all required fields');
    setButtonLoading(updateBtn, false);
    return;
  }

  const headers = getAuthHeaders();
  if (!headers) { setButtonLoading(updateBtn, false); return; }

  const formData = new FormData();
  formData.append('title', title);
  formData.append('date', date);
  formData.append('description', desc);
  if (status) formData.append('status', status);

  editCurrentImages.forEach(url => formData.append('images', url));
  editCurrentVideos.forEach(url => formData.append('videos', url));
  editNewFiles.forEach(file => {
    const field = file.type.startsWith('image/') ? 'images' : 'videos';
    formData.append(field, file);
  });

  try {
    const res = await fetch(`${API_BASE}/update/${id}`, {
      method: 'PATCH',
      headers: headers,
      body: formData
    });
    const result = await res.json();

    if (result.success) {
      showMessage('Success', 'Event updated!');
      closeModal('editModal');
      editNewFiles = [];
      loadEvents();
    } else {
      showMessage('Error', result.message || 'Update failed');
    }
  } catch (err) {
    showMessage('Error', 'Network error');
  } finally {
    setButtonLoading(updateBtn, false);
  }
}

// ====================
// EVENT DETAILS
// ====================
async function fetchEventById(id) {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('No token');
  const res = await fetch(`${API_BASE}/${id}`, { headers });
  if (!res.ok) throw new Error('Fetch failed');
  const result = await res.json();
  if (result.success) return result.data;
  throw new Error(result.message);
}

async function openEventDetails(id) {
  const modal = document.getElementById('eventDetailsModal');
  const content = document.getElementById('eventDetailsContent');
  content.innerHTML = '<div class="modal-loading"><i class="fas fa-spinner fa-spin"></i><p>Loading...</p></div>';
  modal.classList.add('active');

  try {
    const event = await fetchEventById(id);
    renderEventDetails(event);
  } catch (err) {
    content.innerHTML = '<p>Error loading event details</p>';
  }
}

function renderEventDetails(event) {
  const content = document.getElementById('eventDetailsContent');
  const title = document.getElementById('eventDetailsTitle');
  title.textContent = event.title;

  const dateStr = event.date ? new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  }) : 'No date';

  content.innerHTML = `
    <div class="event-details">
      <div class="event-details-header">
        <h1 class="event-details-title">${event.title}</h1>
        <div class="event-details-meta">
          <span><i class="fas fa-calendar"></i> ${dateStr}</span>
          <span><i class="fas fa-tag"></i> ${event.status}</span>
        </div>
      </div>
      <div class="event-details-description">${event.description || 'No description'}</div>
      <div class="media-gallery">
        <div class="media-section">
          <h3><i class="fas fa-images"></i> Images (${event.images?.length || 0})</h3>
          ${event.images?.length ? `<div class="media-grid images-grid">
            ${event.images.map(src => `<div class="media-item" onclick="window.open('${src}','_blank')">
              <img src="${src}" onerror="this.src='https://via.placeholder.com/200'">
            </div>`).join('')}
          </div>` : '<p class="no-media">No images</p>'}
        </div>
        <div class="media-section">
          <h3><i class="fas fa-video"></i> Videos (${event.videos?.length || 0})</h3>
          ${event.videos?.length ? `<div class="media-grid videos-grid">
            ${event.videos.map((src, i) => `<div class="media-item">
              <video controls preload="metadata" id="vid-${i}">
                <source src="${src}" type="video/mp4">
              </video>
            </div>`).join('')}
          </div>` : '<p class="no-media">No videos</p>'}
        </div>
      </div>
    </div>
  `;
}

// ====================
// SETUP
// ====================
function setupEventListeners() {
  // Tabs
  document.querySelectorAll('.content-tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('.content-tab, .tab-content').forEach(el => el.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab).classList.add('active');
    };
  });

  // Add event
  document.getElementById('addEventBtn').onclick = () => {
    document.getElementById('add-event-form').style.display = 'block';
  };

  document.getElementById('cancel-add').onclick = () => {
    document.getElementById('add-event-form').style.display = 'none';
    clearForm();
  };

  document.getElementById('save-event').onclick = saveEvent;

  // Modals
  ['closeMessage', 'closeMessageBtn'].forEach(id => {
    document.getElementById(id)?.onclick = () => closeModal('messageModal');
  });

  document.getElementById('closeEventDetailsModal').onclick = () => {
    document.getElementById('eventDetailsModal').classList.remove('active');
  };
  document.getElementById('closeEventDetails').onclick = () => {
    document.getElementById('eventDetailsModal').classList.remove('active');
  };
  document.getElementById('eventDetailsModal').onclick = e => {
    if (e.target === e.currentTarget) document.getElementById('eventDetailsModal').classList.remove('active');
  };

  document.getElementById('updateEvent').onclick = updateEvent;
  document.getElementById('cancelEdit').onclick = () => closeModal('editModal');
  document.getElementById('closeEditModal').onclick = () => closeModal('editModal');
  document.getElementById('editModal').onclick = e => {
    if (e.target === e.currentTarget) closeModal('editModal');
  };

  document.getElementById('closeConfirmationModal').onclick = () => closeModal('confirmationModal');
  document.getElementById('cancelAction').onclick = () => closeModal('confirmationModal');
}

document.addEventListener('DOMContentLoaded', () => {
  loadEvents();
  setupEventListeners();
  setupMediaUpload();
  setupEditMediaUpload();
});

console.log('Events.js loaded with loading states - Nov 10, 2025');