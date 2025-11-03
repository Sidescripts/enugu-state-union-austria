// js/announcements.js
const API_BASE = '/api/v1';
let announcements = [];

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing announcements...');
  initializeApp();
});

async function initializeApp() {
  try {
    console.log('Initializing announcements app...');
    
    // Hide all modals and forms on startup
    hideAllModals();
    
    // Load announcements from server
    await fetchAnnouncements();
    
    // Setup event listeners
    setupEventListeners();
    
    console.log('Announcements app initialized successfully');
    
  } catch (error) {
    console.error('Error initializing app:', error);
    showNotification('error', 'Initialization Error', 'Failed to initialize announcements page');
  }
}

function hideAllModals() {
  const addForm = document.getElementById('add-announcement-form');
  if (addForm) addForm.style.display = 'none';
  
  const editModal = document.getElementById('editModal');
  if (editModal) editModal.style.display = 'none';
  
  const deleteModal = document.getElementById('deleteModal');
  if (deleteModal) deleteModal.style.display = 'none';
}

function setupEventListeners() {
  // Add announcement button
  const addBtn = document.getElementById('addAnnouncementBtn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      document.getElementById('add-announcement-form').style.display = 'block';
    });
  }

  // Cancel add announcement
  const cancelBtn = document.getElementById('cancel-announcement');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      document.getElementById('add-announcement-form').style.display = 'none';
      resetForm();
    });
  }

  // Browse images button (Add)
  const browseBtn = document.getElementById('browse-images-btn');
  if (browseBtn) {
    browseBtn.addEventListener('click', () => {
      document.getElementById('announcement-images-files').click();
    });
  }

  // Browse images button (Edit)
  const editBrowseBtn = document.getElementById('edit-browse-images-btn');
  if (editBrowseBtn) {
    editBrowseBtn.addEventListener('click', () => {
      document.getElementById('edit-announcement-images-files').click();
    });
  }

  // Form submissions
  const announcementForm = document.getElementById('announcement-form');
  if (announcementForm) {
    announcementForm.addEventListener('submit', handleCreateAnnouncement);
  }

  const editForm = document.getElementById('edit-announcement-form');
  if (editForm) {
    editForm.addEventListener('submit', handleUpdateAnnouncement);
  }

  // Notification button
  const notificationBtn = document.getElementById('notificationBtn');
  if (notificationBtn) {
    notificationBtn.addEventListener('click', () => {
      showNotification('info', 'Notification', 'This is a test notification');
    });
  }

  // File uploads
  setupFileUpload('announcement-images-files', 'announcement-images-preview');
  setupDragDrop('announcement-images-upload', 'announcement-images-files');

  // Edit modal file upload
  const editFileInput = document.getElementById('edit-announcement-images-files');
  if (editFileInput) {
    editFileInput.addEventListener('change', handleEditImageChange);
  }
  setupDragDrop('edit-announcement-images-upload', 'edit-announcement-images-files');

  // Modal controls
  const closeEditModalBtn = document.getElementById('closeEditModal');
  if (closeEditModalBtn) closeEditModalBtn.addEventListener('click', closeEditModal);
  
  const cancelEditBtn = document.getElementById('cancelEdit');
  if (cancelEditBtn) cancelEditBtn.addEventListener('click', closeEditModal);
  
  const closeDeleteModalBtn = document.getElementById('closeDeleteModal');
  if (closeDeleteModalBtn) closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
  
  const cancelDeleteBtn = document.getElementById('cancelDelete');
  if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModal);
  
  const confirmDeleteBtn = document.getElementById('confirmDelete');
  if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', handleDeleteAnnouncement);
}

// API Functions
async function fetchAnnouncements() {
  try {
    showLoadingState(true);
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch(`${API_BASE}/a/all`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if(response.status === 401){
      setTimeout(() =>{
        window.location.href = '../index.html'
      },2500)
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      announcements = Array.isArray(result.data) ? result.data : [];
      console.log('Fetched announcements:', announcements);
      renderAnnouncements();
    } else {
      throw new Error(result.message || 'Failed to fetch announcements');
    }
  } catch (error) {
    console.error('Error fetching announcements:', error);
    showNotification('error', 'Error', 'Failed to load announcements: ' + error.message);
    announcements = [];
    renderAnnouncements();
  } finally {
    showLoadingState(false);
  }
}

async function handleCreateAnnouncement(event) {
  event.preventDefault();
  console.log('Creating announcement...');
  
  const title = document.getElementById('announcement-title').value.trim();
  const content = document.getElementById('announcement-content').value.trim();
  const expiresAt = document.getElementById('announcement-expiresAt').value;
  const isImportant = document.getElementById('announcement-isImportant').checked;
  
  if (!title || !content) {
    showNotification('error', 'Validation Error', 'Title and content are required fields');
    return;
  }

  try {
    showSaveLoading(true);
    clearFormErrors();

    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');

    const form = event.target;
    const formData = new FormData(form);
    
    console.log('FormData entries:');
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    const response = await fetch(`${API_BASE}/a/create`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    const result = await response.json();
    console.log('Create response:', result);

    if (!response.ok) {
      if (result.errors) {
        displayFormErrors(result.errors);
        throw new Error('Validation failed');
      }
      throw new Error(result.message || 'Failed to create announcement');
    }

    if (result.success) {
      showNotification('success', 'Success', 'Announcement created successfully!');
      document.getElementById('add-announcement-form').style.display = 'none';
      resetForm();
      await fetchAnnouncements();
    } else {
      throw new Error(result.message || 'Failed to create announcement');
    }
  } catch (error) {
    console.error('Error creating announcement:', error);
    if (!error.message.includes('Validation failed')) {
      showNotification('error', 'Error', 'Failed to create announcement: ' + error.message);
    }
  } finally {
    showSaveLoading(false);
  }
}

async function handleUpdateAnnouncement(event) {
  event.preventDefault();
  
  const announcementId = document.getElementById('edit-announcement-id').value;
  const title = document.getElementById('edit-announcement-title').value.trim();
  const content = document.getElementById('edit-announcement-content').value.trim();
  const expiresAt = document.getElementById('edit-announcement-expiresAt').value;
  const isImportant = document.getElementById('edit-announcement-isImportant').checked;

  try {
    showUpdateLoading(true);
    clearEditFormErrors();

    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('isImportant', isImportant);
    if (expiresAt) formData.append('expiresAt', expiresAt);

    // === IMAGES: Send existing URLs + new files ===
    const keptUrls = window.currentEditImages
      .filter(img => img.url && !img.file)
      .map(img => img.url);
    const newFiles = window.currentEditImages
      .filter(img => img.file)
      .map(img => img.file);

    if (keptUrls.length > 0) {
      formData.append('existingImages', JSON.stringify(keptUrls));
    }
    newFiles.forEach(file => formData.append('images', file));

    const response = await fetch(`${API_BASE}/a/update/${announcementId}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    const result = await response.json();

    if (!response.ok) {
      if (result.errors) {
        displayEditFormErrors(result.errors);
        throw new Error('Validation failed');
      }
      throw new Error(result.message || 'Failed to update announcement');
    }

    if (result.success) {
      showNotification('success', 'Success', 'Announcement updated successfully!');
      closeEditModal();
      await fetchAnnouncements();
    } else {
      throw new Error(result.message || 'Failed to update announcement');
    }
  } catch (error) {
    console.error('Error updating announcement:', error);
    if (!error.message.includes('Validation failed')) {
      showNotification('error', 'Error', 'Failed to update announcement: ' + error.message);
    }
  } finally {
    showUpdateLoading(false);
  }
}

async function handleDeleteAnnouncement() {
  const announcementId = document.getElementById('delete-announcement-id').value;

  try {
    showDeleteLoading(true);

    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch(`${API_BASE}/a/delete/${announcementId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (!response.ok) throw new Error(result.message || 'Failed to delete announcement');
    if (result.success) {
      showNotification('success', 'Success', 'Announcement deleted successfully!');
      closeDeleteModal();
      await fetchAnnouncements();
    } else {
      throw new Error(result.message || 'Failed to delete announcement');
    }
  } catch (error) {
    console.error('Error deleting announcement:', error);
    showNotification('error', 'Error', 'Failed to delete announcement: ' + error.message);
  } finally {
    showDeleteLoading(false);
  }
}

async function toggleAnnouncementImportance(announcementId) {
  try {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch(`${API_BASE}/a/toggle-importance/${announcementId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (!response.ok) throw new Error(result.message || 'Failed to toggle importance');
    if (result.success) {
      showNotification('success', 'Success', 'Announcement importance updated!');
      await fetchAnnouncements();
    } else {
      throw new Error(result.message || 'Failed to toggle importance');
    }
  } catch (error) {
    console.error('Error toggling importance:', error);
    showNotification('error', 'Error', 'Failed to update importance: ' + error.message);
  }
}

// UI Functions
function renderAnnouncements() {
  const list = document.getElementById('announcements-list');
  const emptyState = document.getElementById('empty-state');
  
  if (!announcements || announcements.length === 0) {
    if (list) list.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  list.innerHTML = announcements.map(announcement => `
    <div class="content-card" data-id="${announcement.id}">
      ${announcement.images && announcement.images.length > 0 ? 
        `<img src="${announcement.images[0]}" alt="${announcement.title}" class="content-image">` :
        `<div class="content-image placeholder"><i class="fas fa-bullhorn"></i></div>`
      }
      <div class="content-body">
        <div class="content-header-row">
          <h3 class="content-title">${escapeHtml(announcement.title)}</h3>
          ${announcement.isImportant ? '<span class="badge badge-important">Important</span>' : ''}
        </div>
        <p class="content-description">${escapeHtml(announcement.content)}</p>
        <div class="content-meta">
          <span><i class="far fa-calendar"></i> ${formatDate(announcement.created_at)}</span>
          <span><i class="far fa-images"></i> ${announcement.images ? announcement.images.length : 0} Images</span>
          ${announcement.expiresAt ? `<span><i class="far fa-clock"></i> Expires: ${formatDate(announcement.expiresAt)}</span>` : ''}
        </div>
        <div class="content-actions">
          <button class="btn btn-sm btn-primary edit-btn" data-id="${announcement.id}">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="btn btn-sm ${announcement.isImportant ? 'btn-warning' : 'btn-secondary'} importance-btn" data-id="${announcement.id}">
            <i class="fas ${announcement.isImportant ? 'fa-star' : 'fa-star'}"></i> ${announcement.isImportant ? 'Unmark' : 'Mark'} Important
          </button>
          <button class="btn btn-sm btn-danger delete-btn" data-id="${announcement.id}">
            <i class="fas fa-trash"></i> Delete
          </button>
        </div>
      </div>
    </div>
  `).join('');

  attachEventListeners();
}

function attachEventListeners() {
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => showEditModal(btn.dataset.id));
  });

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => showDeleteModal(btn.dataset.id));
  });

  document.querySelectorAll('.importance-btn').forEach(btn => {
    btn.addEventListener('click', () => toggleAnnouncementImportance(btn.dataset.id));
  });
}

function showEditModal(announcementId) {
  const announcement = announcements.find(a => a.id === announcementId);
  if (!announcement) return;

  document.getElementById('edit-announcement-id').value = announcement.id;
  document.getElementById('edit-announcement-title').value = announcement.title;
  document.getElementById('edit-announcement-content').value = announcement.content;
  document.getElementById('edit-announcement-isImportant').checked = announcement.isImportant;
  
  if (announcement.expiresAt) {
    const expiresDate = new Date(announcement.expiresAt);
    document.getElementById('edit-announcement-expiresAt').value = expiresDate.toISOString().slice(0, 16);
  } else {
    document.getElementById('edit-announcement-expiresAt').value = '';
  }

  // === LOAD IMAGES INTO EDIT MODAL ===
  const preview = document.getElementById('edit-announcement-images-preview');
  const fileInput = document.getElementById('edit-announcement-images-files');
  preview.innerHTML = '';
  fileInput.value = '';

  window.currentEditImages = (announcement.images || []).map(url => ({ url }));
  displayEditImagePreviews();

  document.getElementById('editModal').style.display = 'flex';
}

function showDeleteModal(announcementId) {
  document.getElementById('delete-announcement-id').value = announcementId;
  document.getElementById('deleteModal').style.display = 'flex';
}

function closeEditModal() {
  document.getElementById('editModal').style.display = 'none';
  clearEditFormErrors();
  window.currentEditImages = [];
}

function closeDeleteModal() {
  document.getElementById('deleteModal').style.display = 'none';
}

// === EDIT IMAGE PREVIEWS ===
function displayEditImagePreviews() {
  const preview = document.getElementById('edit-announcement-images-preview');
  preview.innerHTML = '';

  window.currentEditImages.forEach((img, index) => {
    const item = document.createElement('div');
    item.className = 'file-preview-item';

    if (img.file) {
      const reader = new FileReader();
      reader.onload = e => {
        const imgEl = document.createElement('img');
        imgEl.src = e.target.result;
        imgEl.alt = `Preview ${index + 1}`;
        item.appendChild(imgEl);
        appendRemoveButton(item, index);
        preview.appendChild(item);
      };
      reader.readAsDataURL(img.file);
    } else {
      const imgEl = document.createElement('img');
      imgEl.src = img.url;
      imgEl.alt = `Image ${index + 1}`;
      item.appendChild(imgEl);
      appendRemoveButton(item, index);
      preview.appendChild(item);
    }
  });

  if (window.currentEditImages.length > 0) {
    const count = document.createElement('div');
    count.className = 'file-count';
    count.textContent = `${window.currentEditImages.length}/2 images`;
    count.style.marginTop = '10px';
    count.style.fontSize = '14px';
    count.style.color = '#666';
    preview.appendChild(count);
  }
}

function appendRemoveButton(item, index) {
  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'remove-file';
  remove.innerHTML = '<i class="fas fa-times"></i>';
  remove.onclick = () => {
    window.currentEditImages.splice(index, 1);
    displayEditImagePreviews();
  };
  item.appendChild(remove);
}

function handleEditImageChange(e) {
  const newFiles = Array.from(e.target.files);
  const currentUrls = window.currentEditImages.filter(img => !img.file).length;
  const remaining = 2 - currentUrls;

  const filesToAdd = newFiles.slice(0, remaining);
  filesToAdd.forEach(file => window.currentEditImages.push({ file }));

  if (newFiles.length > remaining) {
    showNotification('warning', 'Limit', `Only ${remaining} more image(s) allowed.`);
  }

  displayEditImagePreviews();
  e.target.value = '';
}

// SIMPLIFIED File Upload & Drag-Drop
function setupFileUpload(inputId, previewId) {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  if (!input || !preview) return;

  let currentFiles = [];

  input.addEventListener('change', (e) => {
    const newFiles = Array.from(e.target.files);
    currentFiles = currentFiles.length === 0 ? newFiles.slice(0, 2) : [...currentFiles, ...newFiles].slice(0, 2);
    if (currentFiles.length > 2) showNotification('warning', 'Warning', 'Max 2 images allowed.');

    updateFilePreviews(currentFiles, preview);
    updateFileInput(input, currentFiles);
  });
}

function updateFilePreviews(files, preview) {
  preview.innerHTML = '';
  files.forEach((file, index) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => {
        const item = document.createElement('div');
        item.className = 'file-preview-item';
        const img = document.createElement('img');
        img.src = e.target.result;
        img.alt = `Preview ${index + 1}`;
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'remove-file';
        remove.innerHTML = '<i class="fas fa-times"></i>';
        remove.onclick = () => {
          files.splice(index, 1);
          updateFilePreviews(files, preview);
          updateFileInput(document.getElementById('announcement-images-files'), files);
        };
        item.append(img, remove);
        preview.appendChild(item);
      };
      reader.readAsDataURL(file);
    }
  });

  if (files.length > 0) {
    const count = document.createElement('div');
    count.className = 'file-count';
    count.textContent = `${files.length}/2 images selected`;
    count.style.marginTop = '10px';
    count.style.fontSize = '14px';
    count.style.color = '#666';
    preview.appendChild(count);
  }
}

function updateFileInput(input, files) {
  const dataTransfer = new DataTransfer();
  files.forEach(file => dataTransfer.items.add(file));
  input.files = dataTransfer.files;
}

function setupDragDrop(areaId, inputId) {
  const area = document.getElementById(areaId);
  const input = document.getElementById(inputId);
  const preview = document.getElementById(inputId === 'announcement-images-files' ? 'announcement-images-preview' : 'edit-announcement-images-preview');
  if (!area || !input || !preview) return;

  let currentFiles = inputId === 'announcement-images-files' ? [] : window.currentEditImages;

  ['dragover', 'dragleave', 'drop'].forEach(evt => area.addEventListener(evt, e => e.preventDefault()));
  
  area.addEventListener('dragover', () => {
    area.style.borderColor = '#667eea';
    area.style.backgroundColor = '#f8f9fa';
  });
  
  area.addEventListener('dragleave', () => {
    area.style.borderColor = '#eaeaea';
    area.style.backgroundColor = 'transparent';
  });
  
  area.addEventListener('drop', (e) => {
    area.style.borderColor = '#eaeaea';
    area.style.backgroundColor = 'transparent';
    
    if (e.dataTransfer.files.length) {
      const newFiles = Array.from(e.dataTransfer.files);
      const max = 2;
      const existing = inputId === 'edit-announcement-images-files' 
        ? window.currentEditImages.filter(img => !img.file).length 
        : currentFiles.length;
      const toAdd = newFiles.slice(0, max - existing);

      toAdd.forEach(file => {
        if (inputId === 'edit-announcement-images-files') {
          window.currentEditImages.push({ file });
        } else {
          currentFiles.push(file);
        }
      });

      if (newFiles.length > (max - existing)) {
        showNotification('warning', 'Limit', `Only ${max - existing} more image(s) allowed.`);
      }

      if (inputId === 'edit-announcement-images-files') {
        displayEditImagePreviews();
      } else {
        updateFilePreviews(currentFiles, preview);
        updateFileInput(input, currentFiles);
      }
    }
  });
}

// Form Management
function resetForm() {
  document.getElementById('announcement-form').reset();
  document.getElementById('announcement-images-preview').innerHTML = '';
  const fileInput = document.getElementById('announcement-images-files');
  fileInput.value = '';
  fileInput.files = new DataTransfer().files;
  clearFormErrors();
}

function clearFormErrors() {
  document.querySelectorAll('.form-error').forEach(el => {
    el.textContent = '';
    el.style.display = 'none';
  });
}

function clearEditFormErrors() {
  document.querySelectorAll('#editModal .form-error').forEach(el => {
    el.textContent = '';
    el.style.display = 'none';
  });
}

function displayFormErrors(errors) {
  clearFormErrors();
  errors.forEach(error => {
    const errorElement = document.getElementById(`${error.path}-error`);
    if (errorElement) {
      errorElement.textContent = error.msg;
      errorElement.style.display = 'block';
    } else {
      showNotification('error', 'Validation Error', `${error.path}: ${error.msg}`);
    }
  });
}

function displayEditFormErrors(errors) {
  clearEditFormErrors();
  errors.forEach(error => {
    const errorElement = document.getElementById(`edit-${error.path}-error`);
    if (errorElement) {
      errorElement.textContent = error.msg;
      errorElement.style.display = 'block';
    }
  });
}

// Loading States
function showLoadingState(loading) {
  const list = document.getElementById('announcements-list');
  if (loading && list) {
    list.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>Loading announcements...</p></div>';
  }
}

function showSaveLoading(loading) {
  const saveText = document.getElementById('save-text');
  const saveLoading = document.getElementById('save-loading');
  const saveButton = document.getElementById('save-announcement');
  if (saveText && saveLoading && saveButton) {
    saveText.style.display = loading ? 'none' : 'inline';
    saveLoading.style.display = loading ? 'inline' : 'none';
    saveButton.disabled = loading;
  }
}

function showUpdateLoading(loading) {
  const updateText = document.getElementById('update-text');
  const updateLoading = document.getElementById('update-loading');
  const updateButton = document.getElementById('updateAnnouncement');
  if (updateText && updateLoading && updateButton) {
    updateText.style.display = loading ? 'none' : 'inline';
    updateLoading.style.display = loading ? 'inline' : 'none';
    updateButton.disabled = loading;
  }
}

function showDeleteLoading(loading) {
  const deleteText = document.getElementById('delete-text');
  const deleteLoading = document.getElementById('delete-loading');
  const deleteButton = document.getElementById('confirmDelete');
  if (deleteText && deleteLoading && deleteButton) {
    deleteText.style.display = loading ? 'none' : 'inline';
    deleteLoading.style.display = loading ? 'inline' : 'none';
    deleteButton.disabled = loading;
  }
}

// Utility Functions
function getAuthToken() {
  return localStorage.getItem('token') || localStorage.getItem('authToken');
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return unsafe;
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showNotification(type, title, message) {
  console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
  alert(`${title}: ${message}`);
}