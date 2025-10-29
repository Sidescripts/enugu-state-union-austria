// Base API URL
const API_BASE = '/api/v1';

// DOM Elements
const addAnnouncementBtn = document.getElementById('addAnnouncementBtn');
const notificationBtn = document.getElementById('notificationBtn');
const addAnnouncementForm = document.getElementById('add-announcement-form');
const cancelAnnouncementBtn = document.getElementById('cancel-announcement');
const saveAnnouncementBtn = document.getElementById('save-announcement');
const announcementsList = document.getElementById('announcements-list');

// Modals
const editModal = document.getElementById('editModal');
const closeEditModal = document.getElementById('closeEditModal');
const cancelEdit = document.getElementById('cancelEdit');
const updateItemBtn = document.getElementById('updateItem');
const editModalContent = document.getElementById('editModalContent');

const confirmationModal = document.getElementById('confirmationModal');
const closeConfirmationModal = document.getElementById('closeConfirmationModal');
const cancelAction = document.getElementById('cancelAction');
const confirmAction = document.getElementById('confirmAction');

const messageModal = document.getElementById('messageModal');
const closeMessageModal = document.getElementById('closeMessageModal');
const closeMessage = document.getElementById('closeMessage');

// Mobile Menu
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

let currentEditId = null;
let currentAction = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Check if elements exist
    if (!announcementsList || !addAnnouncementBtn || !notificationBtn) {
        console.error('Required DOM elements missing');
        return;
    }

    // Load announcements
    await loadAnnouncements();

    // Event Listeners
    addAnnouncementBtn.addEventListener('click', () => {
        if (addAnnouncementForm) {
            addAnnouncementForm.style.display = 'block';
            resetAddForm();
        }
    });

    if (cancelAnnouncementBtn) {
        cancelAnnouncementBtn.addEventListener('click', () => {
            addAnnouncementForm.style.display = 'none';
            resetAddForm();
        });
    }

    if (saveAnnouncementBtn) {
        saveAnnouncementBtn.addEventListener('click', createAnnouncement);
    }

    if (notificationBtn) {
        notificationBtn.addEventListener('click', triggerNotification);
    }

    // File Upload Setup
    setupFileUpload('announcement-photos-files', 'announcement-photos-preview', 'image');
    setupFileUpload('announcement-videos-files', 'announcement-videos-preview', 'video');
    setupDragDrop('announcement-photos-upload', 'announcement-photos-files');
    setupDragDrop('announcement-videos-upload', 'announcement-videos-files');

    // Mobile Sidebar
    if (menuToggle && sidebar && sidebarOverlay) {
        menuToggle.addEventListener('click', toggleSidebar);
        sidebarOverlay.addEventListener('click', toggleSidebar);
    }

    // Modal Close Handlers
    if (closeEditModal) closeEditModal.addEventListener('click', () => editModal.classList.remove('active'));
    if (cancelEdit) cancelEdit.addEventListener('click', () => editModal.classList.remove('active'));
    if (updateItemBtn) updateItemBtn.addEventListener('click', updateAnnouncement);

    if (closeConfirmationModal) closeConfirmationModal.addEventListener('click', () => confirmationModal.classList.remove('active'));
    if (cancelAction) cancelAction.addEventListener('click', () => confirmationModal.classList.remove('active'));
    if (confirmAction) confirmAction.addEventListener('click', () => currentAction && currentAction());

    if (closeMessageModal) closeMessageModal.addEventListener('click', () => messageModal.classList.remove('active'));
    if (closeMessage) closeMessage.addEventListener('click', () => messageModal.classList.remove('active'));

    // Media Tabs
    document.querySelectorAll('.media-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const parent = tab.closest('.form-card') || tab.closest('.modal-body');
            parent.querySelectorAll('.media-tab').forEach(t => t.classList.remove('active'));
            parent.querySelectorAll('.media-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            const mediaType = tab.getAttribute('data-media');
            parent.querySelector(`#${parent.id}-${mediaType}`).classList.add('active');
        });
    });
});

function toggleSidebar() {
    if (sidebar && sidebarOverlay) {
        sidebar.classList.toggle('active');
        sidebarOverlay.classList.toggle('active');
    }
}

async function loadAnnouncements() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../index.html';
        return;
    }
    try {
        const response = await fetch(`${API_BASE}/announcements/all`, {
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.status === 401) {
            window.location.href = '../index.html';
            return;
        }
        if (!response.ok) {
            console.error('Fetch error:', response.status, response.statusText);
            throw new Error('Failed to fetch announcements');
        }
        const { announcements } = await response.json();
        renderAnnouncements(announcements.sort((a, b) => a.order - b.order));
    } catch (err) {
        showMessage('Error', 'Could not load announcements. Please try again.');
        if (announcementsList) {
            announcementsList.innerHTML = '<div class="empty-state"><i class="fas fa-bullhorn"></i><p>No announcements available.</p></div>';
        }
    }
}

function renderAnnouncements(announcements) {
    if (!announcementsList) return;
    if (!announcements.length) {
        announcementsList.innerHTML = '<div class="empty-state"><i class="fas fa-bullhorn"></i><p>No announcements available.</p></div>';
        return;
    }

    announcementsList.innerHTML = '';
    announcements.forEach(ann => {
        const card = document.createElement('div');
        card.className = 'content-card';
        card.dataset.id = ann._id;
        card.innerHTML = `
            <img src="${ann.photoUrls && ann.photoUrls[0] ? ann.photoUrls[0] : '/images/placeholder.jpg'}" 
                 alt="${ann.title}" class="content-image">
            <div class="content-body">
                <h3 class="content-title">${ann.title}</h3>
                <p class="content-description">${ann.description}</p>
                <div class="content-meta">
                    <span>${ann.date}</span>
                    <span>${ann.photoUrls ? ann.photoUrls.length : 0} Photos | ${ann.videoUrls ? ann.videoUrls.length : 0} Videos</span>
                </div>
                <div class="content-actions">
                    <button class="btn btn-sm btn-primary edit-btn" data-id="${ann._id}">Edit</button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${ann._id}">Delete</button>
                </div>
            </div>
        `;
        announcementsList.appendChild(card);
    });

    attachCardEventListeners();
}

function attachCardEventListeners() {
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => openEditModal(btn.dataset.id));
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => confirmDelete(btn.dataset.id));
    });
}

// === CREATE ANNOUNCEMENT ===
async function createAnnouncement() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../index.html';
        return;
    }
    const title = document.getElementById('announcement-title')?.value.trim();
    const date = document.getElementById('announcement-date')?.value;
    const caption = document.getElementById('announcement-caption')?.value.trim();
    const description = document.getElementById('announcement-description')?.value.trim();
    const order = parseInt(document.getElementById('announcement-order')?.value) || 0;
    const photoFiles = document.getElementById('announcement-photos-files')?.files;
    const videoFiles = document.getElementById('announcement-videos-files')?.files;

    if (!title || !date) {
        showMessage('Error', 'Title and date are required.');
        return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('date', date);
    formData.append('caption', caption);
    formData.append('description', description);
    formData.append('order', order);
    for (let file of photoFiles) formData.append('photos', file);
    for (let file of videoFiles) formData.append('videos', file);

    try {
        const response = await fetch(`${API_BASE}/announcements/create`, {
            method: 'POST',
            body: formData,
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create announcement');
        }
        addAnnouncementForm.style.display = 'none';
        showNotification('Success', 'Announcement created successfully!');
        await loadAnnouncements();
    } catch (err) {
        showMessage('Error', err.message || 'Failed to create announcement');
    }
}

// === EDIT ANNOUNCEMENT ===
async function openEditModal(id) {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../index.html';
        return;
    }
    currentEditId = id;
    try {
        const response = await fetch(`${API_BASE}/announcements/${id}`, {
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.status === 401) {
            window.location.href = '../index.html';
            return;
        }
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch announcement');
        }
        const ann = await response.json();

        const editForm = `
            <div class="media-tabs">
                <button class="media-tab active" data-media="photos">Photos</button>
                <button class="media-tab" data-media="videos">Videos</button>
            </div>
            <div class="media-content active" id="edit-announcement-photos">
                <div class="file-upload-area" id="edit-announcement-photos-upload">
                    <i class="fas fa-cloud-upload-alt"></i>
                    <p>Drag & drop images here, or click to browse</p>
                    <input type="file" id="edit-announcement-photos-files" multiple style="display: none;" accept="image/*">
                    <button class="btn btn-primary" onclick="document.getElementById('edit-announcement-photos-files').click()">Browse Images</button>
                </div>
                <div class="file-preview" id="edit-announcement-photos-preview">
                    ${ann.photoUrls ? ann.photoUrls.map(url => `
                        <div class="file-preview-item">
                            <img src="${url}">
                            <button class="remove-file"><i class="fas fa-times"></i></button>
                        </div>
                    `).join('') : ''}
                </div>
            </div>
            <div class="media-content" id="edit-announcement-videos">
                <div class="file-upload-area" id="edit-announcement-videos-upload">
                    <i class="fas fa-cloud-upload-alt"></i>
                    <p>Drag & drop videos here, or click to browse</p>
                    <input type="file" id="edit-announcement-videos-files" multiple style="display: none;" accept="video/*">
                    <button class="btn btn-primary" onclick="document.getElementById('edit-announcement-videos-files').click()">Browse Videos</button>
                </div>
                <div class="file-preview" id="edit-announcement-videos-preview">
                    ${ann.videoUrls ? ann.videoUrls.map(url => `
                        <div class="file-preview-item">
                            <video src="${url}" controls width="100"></video>
                            <button class="remove-file"><i class="fas fa-times"></i></button>
                        </div>
                    `).join('') : ''}
                </div>
            </div>
            <div class="row">
                <div class="form-group col-md-6">
                    <label for="edit-announcement-title">Announcement Title</label>
                    <input type="text" class="form-control" id="edit-announcement-title" value="${ann.title || ''}">
                </div>
                <div class="form-group col-md-6">
                    <label for="edit-announcement-date">Announcement Date</label>
                    <input type="date" class="form-control" id="edit-announcement-date" value="${ann.date || ''}">
                </div>
                <div class="form-group col-md-6">
                    <label for="edit-announcement-order">Order</label>
                    <input type="number" class="form-control" id="edit-announcement-order" value="${ann.order || 0}">
                </div>
                <div class="form-group col-12">
                    <label for="edit-announcement-caption">Caption</label>
                    <input type="text" class="form-control" id="edit-announcement-caption" value="${ann.caption || ''}">
                </div>
                <div class="form-group col-12">
                    <label for="edit-announcement-description">Description</label>
                    <textarea class="form-control" id="edit-announcement-description" rows="4">${ann.description || ''}</textarea>
                </div>
            </div>
        `;

        if (editModalContent) {
            editModalContent.innerHTML = editForm;
            editModalContent.setAttribute('data-edit-id', id);
            editModal.classList.add('active');
        }

        setupFileUpload('edit-announcement-photos-files', 'edit-announcement-photos-preview', 'image');
        setupFileUpload('edit-announcement-videos-files', 'edit-announcement-videos-preview', 'video');
        setupDragDrop('edit-announcement-photos-upload', 'edit-announcement-photos-files');
        setupDragDrop('edit-announcement-videos-upload', 'edit-announcement-videos-files');

        // Remove media button
        document.querySelectorAll('.remove-file').forEach(btn => {
            btn.onclick = () => {
                btn.parentElement.remove();
                // Clear file input to allow re-upload
                document.getElementById('edit-announcement-photos-files').value = '';
                document.getElementById('edit-announcement-videos-files').value = '';
            };
        });

    } catch (err) {
        showMessage('Error', err.message);
    }
}

async function updateAnnouncement() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../index.html';
        return;
    }
    const title = document.getElementById('edit-announcement-title')?.value.trim();
    const date = document.getElementById('edit-announcement-date')?.value;
    const caption = document.getElementById('edit-announcement-caption')?.value.trim();
    const description = document.getElementById('edit-announcement-description')?.value.trim();
    const order = parseInt(document.getElementById('edit-announcement-order')?.value) || 0;
    const photoFiles = document.getElementById('edit-announcement-photos-files')?.files;
    const videoFiles = document.getElementById('edit-announcement-videos-files')?.files;

    if (!title || !date) {
        showMessage('Error', 'Title and date are required.');
        return;
    }

    const formData = new FormData();
    for (let file of photoFiles) formData.append('photos', file);
    for (let file of videoFiles) formData.append('videos', file);

    if (photoFiles.length || videoFiles.length) {
        try {
            const response = await fetch(`${API_BASE}/announcements/update-media/${currentEditId}`, {
                method: 'PATCH',
                body: formData,
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update media');
            }
        } catch (err) {
            showMessage('Error', err.message);
            return;
        }
    }

    try {
        const response = await fetch(`${API_BASE}/announcements/update/${currentEditId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, date, caption, description, order }),
            credentials: 'include'
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update announcement');
        }
        editModal.classList.remove('active');
        showNotification('Success', 'Announcement updated successfully!');
        await loadAnnouncements();
    } catch (err) {
        showMessage('Error', err.message);
    }
}

// === DELETE ANNOUNCEMENT ===
function confirmDelete(id) {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../index.html';
        return;
    }
    currentEditId = id;
    if (document.getElementById('confirmationTitle')) {
        document.getElementById('confirmationTitle').textContent = 'Delete Announcement';
    }
    if (document.getElementById('confirmationMessage')) {
        document.getElementById('confirmationMessage').textContent = 'Are you sure you want to delete this announcement? This cannot be undone.';
    }
    confirmationModal.classList.add('active');

    currentAction = async () => {
        try {
            const response = await fetch(`${API_BASE}/announcements/delete/${currentEditId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete');
            }
            confirmationModal.classList.remove('active');
            showNotification('Success', 'Announcement deleted!');
            await loadAnnouncements();
        } catch (err) {
            showMessage('Error', err.message);
        }
    };
}

// === NOTIFICATION TRIGGER ===
async function triggerNotification() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../index.html';
        return;
    }
    try {
        const response = await fetch(`${API_BASE}/announcements/notification`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ isNewNotification: true }),
            credentials: 'include'
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to trigger notification');
        }
        showNotification('Success', 'Notification banner triggered!');
    } catch (err) {
        showMessage('Error', err.message);
    }
}

// === FILE UPLOAD HELPERS ===
function setupFileUpload(inputId, previewId, type) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    if (!input || !preview) return;

    input.addEventListener('change', () => {
        preview.innerHTML = '';
        for (let file of input.files) {
            if ((type === 'image' && !file.type.startsWith('image/')) || 
                (type === 'video' && !file.type.startsWith('video/'))) {
                showMessage('Error', `Please upload valid ${type} files.`);
                continue;
            }
            const reader = new FileReader();
            reader.onload = e => {
                const item = document.createElement('div');
                item.className = 'file-preview-item';
                if (type === 'image') {
                    item.innerHTML = `
                        <img src="${e.target.result}">
                        <button class="remove-file"><i class="fas fa-times"></i></button>
                    `;
                } else {
                    item.innerHTML = `
                        <video src="${e.target.result}" controls width="100"></video>
                        <button class="remove-file"><i class="fas fa-times"></i></button>
                    `;
                }
                item.querySelector('.remove-file').onclick = () => {
                    item.remove();
                    input.value = ''; // Clear input to allow re-upload
                };
                preview.appendChild(item);
            };
            reader.readAsDataURL(file);
        }
    });
}

function setupDragDrop(areaId, inputId) {
    const area = document.getElementById(areaId);
    const input = document.getElementById(inputId);
    if (!area || !input) return;

    area.addEventListener('dragover', e => {
        e.preventDefault();
        area.style.borderColor = '#667eea';
    });
    area.addEventListener('dragleave', () => {
        area.style.borderColor = '#eaeaea';
    });
    area.addEventListener('drop', e => {
        e.preventDefault();
        area.style.borderColor = '#eaeaea';
        if (e.dataTransfer.files.length) {
            input.files = e.dataTransfer.files;
            input.dispatchEvent(new Event('change'));
        }
    });
}

// === UTILITIES ===
function resetAddForm() {
    const title = document.getElementById('announcement-title');
    const date = document.getElementById('announcement-date');
    const caption = document.getElementById('announcement-caption');
    const description = document.getElementById('announcement-description');
    const order = document.getElementById('announcement-order');
    const photosPreview = document.getElementById('announcement-photos-preview');
    const videosPreview = document.getElementById('announcement-videos-preview');
    const photosFiles = document.getElementById('announcement-photos-files');
    const videosFiles = document.getElementById('announcement-videos-files');

    if (title) title.value = '';
    if (date) date.value = '';
    if (caption) caption.value = '';
    if (description) description.value = '';
    if (order) order.value = '';
    if (photosPreview) photosPreview.innerHTML = '';
    if (videosPreview) videosPreview.innerHTML = '';
    if (photosFiles) photosFiles.value = '';
    if (videosFiles) videosFiles.value = '';
}

function showMessage(title, message) {
    const messageTitle = document.getElementById('messageTitle');
    const messageText = document.getElementById('messageText');
    if (messageTitle && messageText) {
        messageTitle.textContent = title;
        messageText.textContent = message;
        messageModal.classList.add('active');
    }
}

function showNotification(title, message) {
    const notif = document.createElement('div');
    notif.className = 'notification notification-success';
    notif.innerHTML = `
        <div class="notification-icon"><i class="fas fa-check"></i></div>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close"><i class="fas fa-times"></i></button>
    `;
    const notificationContainer = document.getElementById('notificationContainer');
    if (notificationContainer) {
        notificationContainer.appendChild(notif);
        setTimeout(() => notif.classList.add('show'), 100);

        notif.querySelector('.notification-close').onclick = () => {
            notif.classList.remove('show');
            setTimeout(() => notif.remove(), 300);
        };

        setTimeout(() => {
            if (notif.parentNode) {
                notif.classList.remove('show');
                setTimeout(() => notif.remove(), 300);
            }
        }, 5000);
    }
}