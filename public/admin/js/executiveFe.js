// executiveFe.js
const API_BASE = '/api/v1';

// DOM Elements
const addExecutiveBtn = document.getElementById('addExecutiveBtn');
const addExecutiveForm = document.getElementById('add-executive-form');
const cancelExecutiveBtn = document.getElementById('cancel-executive');
const saveExecutiveBtn = document.getElementById('save-executive');
const executivesList = document.getElementById('executives-list');

// Modals
const editModal = document.getElementById('editModal');
const closeEditModal = document.getElementById('closeEditModal');
const confirmationModal = document.getElementById('confirmationModal');
const closeConfirmationModal = document.getElementById('closeConfirmationModal');
const cancelAction = document.getElementById('cancelAction');
const confirmAction = document.getElementById('confirmAction');
const messageModal = document.getElementById('messageModal');
const closeMessageModal = document.getElementById('closeMessageModal');
const closeMessage = document.getElementById('closeMessage');
const editModalContent = document.getElementById('editModalContent');

// Mobile Menu
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

let currentEditId = null;
let currentAction = null;

document.addEventListener('DOMContentLoaded', async () => {
    await loadExecutives();

    // Event Listeners
    addExecutiveBtn.addEventListener('click', () => {
        addExecutiveForm.style.display = 'block';
        resetAddForm();
    });

    cancelExecutiveBtn.addEventListener('click', () => {
        addExecutiveForm.style.display = 'none';
        resetAddForm();
    });

    saveExecutiveBtn.addEventListener('click', createExecutive);

    setupFileUpload('executive-photo-file', 'executive-photo-preview');
    setupDragDrop('executive-photo-upload', 'executive-photo-file');

    menuToggle.addEventListener('click', toggleSidebar);
    sidebarOverlay.addEventListener('click', toggleSidebar);

    closeEditModal.addEventListener('click', () => editModal.classList.remove('active'));
    closeConfirmationModal.addEventListener('click', () => confirmationModal.classList.remove('active'));
    cancelAction.addEventListener('click', () => confirmationModal.classList.remove('active'));
    confirmAction.addEventListener('click', () => currentAction && currentAction());
    closeMessageModal.addEventListener('click', () => messageModal.classList.remove('active'));
    closeMessage.addEventListener('click', () => messageModal.classList.remove('active'));
});

function toggleSidebar() {
    sidebar.classList.toggle('active');
    sidebarOverlay.classList.toggle('active');
}

async function loadExecutives() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../index.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/ex/all`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            window.location.href = '../index.html';
            return;
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server error:', errorText);
            throw new Error(`Failed to fetch executives: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        let executives = data.data || data.executives || data;
        if (!Array.isArray(executives)) {
            console.error('Expected array but got:', executives);
            executives = [];
        }

        renderExecutives(executives.sort((a, b) => (a.order || 0) - (b.order || 0)));
    } catch (err) {
        console.error('Error loading executives:', err);
        showMessage('Error', 'Could not load executives. Please try again.');
        executivesList.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><p>No executives available.</p></div>';
    }
}

function renderExecutives(executives) {
    console.log('Rendering executives:', executives);
    if (!executives || executives.length === 0) {
        executivesList.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><p>No executives available.</p></div>';
        return;
    }

    executivesList.innerHTML = '';
    executives.forEach(exec => {
        const id = exec.id || exec._id || 'unknown';
        const name = exec.name || 'Unknown Name';
        const position = exec.position || 'Unknown Position';
        const bio = exec.bio || '';
        // const image = exec.image ;
        const image = exec.image || `https://via.placeholder.com/120x120/667eea/ffffff?text=${encodeURIComponent(name.split(' ').map(w => w[0]).join('').toUpperCase())}`;
        const order = exec.order || 0;

        const card = document.createElement('div');
        card.className = 'profile-card';
        card.dataset.id = id;
        card.innerHTML = `
            <img src="${image}" alt="${name}" class="profile-image">
            <div class="content-body">
                <h3 class="content-title">${name}</h3>
                <p class="content-description">${position}</p>
                ${bio ? `<p class="content-description">${bio}</p>` : ''}
                <div class="content-actions">
                    <button class="btn btn-sm btn-primary edit-btn" data-id="${id}">Edit</button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${id}">Delete</button>
                </div>
            </div>
        `;
        executivesList.appendChild(card);
    });

    attachCardEventListeners();
}

function attachCardEventListeners() {
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openEditModal(btn.dataset.id);
        });
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            confirmDelete(btn.dataset.id);
        });
    });
}

async function createExecutive() {
    console.log('createExecutive called');
    const nameInput = document.getElementById('executive-name');
    const positionInput = document.getElementById('executive-position');
    const bioInput = document.getElementById('executive-bio');
    const orderInput = document.getElementById('executive-order');
    const fileInput = document.getElementById('executive-photo-file');
    const token = localStorage.getItem('token');

    if (!nameInput || !positionInput || !bioInput || !orderInput || !fileInput) {
        console.error('One or more input elements not found');
        showMessage('Error', 'Form inputs are missing. Check HTML IDs.');
        return;
    }

    const name = nameInput.value.trim();
    const position = positionInput.value.trim();
    const bio = bioInput.value.trim();
    const order = parseInt(orderInput.value) || 0;

    console.log('Input values:', { name, position, bio, order, file: fileInput.files[0] });

    if (!name || !position) {
        showMessage('Error', 'Name and position are required.');
        return;
    }

    if (!fileInput.files[0]) {
        showMessage('Error', 'An image is required.');
        return;
    }

    const file = fileInput.files[0];
    if (!file.type.startsWith('image/')) {
        showMessage('Error', 'Only image files are allowed.');
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        showMessage('Error', 'Image size exceeds 5MB limit.');
        return;
    }

    if (!token) {
        showMessage('Error', 'Authentication token is missing.');
        return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('position', position);
    formData.append('bio', bio);
    formData.append('order', order.toString());
    formData.append('image', file);

    console.log('FormData contents:');
    for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
    }

    try {
        const response = await fetch(`${API_BASE}/ex/create`, {
            method: 'POST',
            body: formData,
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server response:', response.status, errorText);
            throw new Error(`Failed to create executive: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('Create executive success:', result);
        addExecutiveForm.style.display = 'none';
        resetAddForm();
        setTimeout(() =>{
            showNotification('Success', 'Executive created successfully!');
        },3000)
        
        await loadExecutives();
    } catch (err) {
        console.error('Create executive error:', err);
        showMessage('Error', err.message || 'Failed to create executive');
    }
}

async function openEditModal(id) {
    currentEditId = id;
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_BASE}/ex/${id}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch executive: ${response.status} - ${errorText}`);
        }

        const exec = await response.json();
        console.log('Editing executive:', exec);
        console.log(exec.data)
        console.log(exec.data.name)
        const editForm = `
            <div class="file-upload-area" id="edit-executive-photo-upload">
                <i class="fas fa-cloud-upload-alt"></i>
                <p>Drag & drop image here, or click to browse (required)</p>
                <input type="file" id="edit-executive-photo-file" style="display: none;" accept="image/*">
                <button type="button" class="btn btn-primary" onclick="document.getElementById('edit-executive-photo-file').click()">Browse Image</button>
            </div>
            <div class="file-preview" id="edit-executive-photo-preview">
                ${exec.data.image ? `
                <div class="file-preview-item">
                    <img src="${exec.data.image}" onerror="this.style.display='none'">
                    <button type="button" class="remove-file"><i class="fas fa-times"></i></button>
                </div>` : ''}
            </div>
            <div class="row">
                <div class="form-group col-md-6">
                    <label for="edit-executive-name">Name</label>
                    <input type="text" class="form-control" id="edit-executive-name" value="${exec.data.name || ''}">
                </div>
                <div class="form-group col-md-6">
                    <label for="edit-executive-position">Position</label>
                    <input type="text" class="form-control" id="edit-executive-position" value="${exec.data.position || ''}">
                </div>
                <div class="form-group col-md-6">
                    <label for="edit-executive-order">Order</label>
                    <input type="number" class="form-control" id="edit-executive-order" value="${exec.data.order || 0}">
                </div>
                <div class="form-group col-12">
                    <label for="edit-executive-bio">Bio</label>
                    <textarea class="form-control" id="edit-executive-bio" rows="4">${exec.data.bio || ''}</textarea>
                </div>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" id="cancel-edit-executive">Cancel</button>
                <button type="button" class="btn btn-primary" id="save-edit-executive">Save</button>
            </div>
        `;

        editModalContent.innerHTML = editForm;
        editModal.classList.add('active');

        setupFileUpload('edit-executive-photo-file', 'edit-executive-photo-preview');
        setupDragDrop('edit-executive-photo-upload', 'edit-executive-photo-file');

        document.querySelectorAll('.remove-file').forEach(btn => {
            btn.onclick = () => {
                console.log('Removing file preview');
                btn.parentElement.remove();
                document.getElementById('edit-executive-photo-file').value = '';
            };
        });

        document.getElementById('cancel-edit-executive').addEventListener('click', () => {
            editModal.classList.remove('active');
        });
        document.getElementById('save-edit-executive').addEventListener('click', saveEditedExecutive);
    } catch (err) {
        console.error('Error opening edit modal:', err);
        showMessage('Error', err.message);
    }
}

async function saveEditedExecutive() {
    console.log('saveEditedExecutive called');
    const nameInput = document.getElementById('edit-executive-name');
    const positionInput = document.getElementById('edit-executive-position');
    const bioInput = document.getElementById('edit-executive-bio');
    const orderInput = document.getElementById('edit-executive-order');
    const fileInput = document.getElementById('edit-executive-photo-file');
    const token = localStorage.getItem('token');

    if (!nameInput || !positionInput || !bioInput || !orderInput || !fileInput) {
        console.error('One or more input elements not found');
        showMessage('Error', 'Form inputs are missing. Check HTML IDs.');
        return;
    }

    const name = nameInput.value.trim();
    const position = positionInput.value.trim();
    const bio = bioInput.value.trim();
    const order = parseInt(orderInput.value) || 0;

    console.log('Input values:', { name, position, bio, order, file: fileInput.files[0], id: currentEditId });

    if (!name || !position) {
        showMessage('Error', 'Name and position are required.');
        return;
    }

    let hasImage = fileInput.files[0] || document.querySelector('#edit-executive-photo-preview img');
    if (!hasImage) {
        showMessage('Error', 'An image is required.');
        return;
    }

    if (fileInput.files[0]) {
        const file = fileInput.files[0];
        if (!file.type.startsWith('image/')) {
            showMessage('Error', 'Only image files are allowed.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showMessage('Error', 'Image size exceeds 5MB limit.');
            return;
        }
    }

    if (!token) {
        showMessage('Error', 'Authentication token is missing., Login Again');
        return;
    }

    if (!currentEditId) {
        showMessage('Error', 'No executive ID provided for editing.');
        return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('position', position);
    formData.append('bio', bio);
    formData.append('order', order.toString());
    if (fileInput.files[0]) {
        formData.append('image', fileInput.files[0]);
    }

    console.log('FormData contents:');
    for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
    }

    try {
        const response = await fetch(`${API_BASE}/ex/update/${currentEditId}`, {
            method: 'PATCH',
            body: formData,
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server response:', response.status, errorText);
            throw new Error(`Failed to update executive: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('Update executive success:', result);
        editModal.classList.remove('active');
        showNotification('Success', 'Executive updated successfully!');
        await loadExecutives();
    } catch (err) {
        console.error('Update executive error:', err);
        showMessage('Error', err.message || 'Failed to update executive');
    }
}

function confirmDelete(id) {
    currentEditId = id;
    document.getElementById('confirmationTitle').textContent = 'Delete Executive';
    document.getElementById('confirmationMessage').textContent = 'Are you sure you want to delete this executive? This cannot be undone.';
    confirmationModal.classList.add('active');

    currentAction = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${API_BASE}/ex/delete/${id}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to delete: ${response.status} - ${errorText}`);
            }

            confirmationModal.classList.remove('active');
            showNotification('Success', 'Executive deleted successfully!');
            await loadExecutives();
        } catch (err) {
            console.error('Error deleting executive:', err);
            showMessage('Error', err.message || 'Failed to delete executive');
        }
    };
}

function resetAddForm() {
    console.log('resetAddForm called');
    document.getElementById('executive-name').value = '';
    document.getElementById('executive-position').value = '';
    document.getElementById('executive-bio').value = '';
    document.getElementById('executive-order').value = '0';
    document.getElementById('executive-photo-preview').innerHTML = '';
    document.getElementById('executive-photo-file').value = '';
}