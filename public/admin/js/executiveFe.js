
    // Base API URL - adjust if needed
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
        // Load executives
        await loadExecutives();

        // Event Listeners
        addExecutiveBtn.addEventListener('click', () => {
            addExecutiveForm.style.display = 'block';
            resetAddForm();
        });

        cancelExecutiveBtn.addEventListener('click', () => {
            addExecutiveForm.style.display = 'none';
        });

        saveExecutiveBtn.addEventListener('click', createExecutive);

        // File Upload Setup
        setupFileUpload('executive-photo-file', 'executive-photo-preview');
        setupDragDrop('executive-photo-upload', 'executive-photo-file');

        // Mobile Sidebar
        menuToggle.addEventListener('click', toggleSidebar);
        sidebarOverlay.addEventListener('click', toggleSidebar);

        // Modal Close Handlers
        closeEditModal.addEventListener('click', () => editModal.classList.remove('active'));
        cancelEdit.addEventListener('click', () => editModal.classList.remove('active'));
        updateItemBtn.addEventListener('click', updateExecutive);

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
        try {
            const response = await fetch(`${API_BASE}/ex/all`, {
                credentials: 'include',
                  headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
            });
            if (response.status === 401) {
                // Unauthorized, redirect to login
                window.location.href = '../index.html';
                return;
            }

            if (!response.ok) throw new Error('Failed to fetch executives');
            console.log(!response.ok.error);
            const executives = await response.json();
            renderExecutives(executives.sort((a, b) => a.order - b.order));
        } catch (err) {
            showMessage('Error', 'Could not load executives. Please try again.');
            executivesList.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><p>No executives available.</p></div>';
        }
    }

    function renderExecutives(executives) {
        if (!executives.length) {
            executivesList.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><p>No executives available.</p></div>';
            return;
        }

        executivesList.innerHTML = '';
        executives.forEach(exec => {
            const card = document.createElement('div');
            card.className = 'profile-card';
            card.dataset.id = exec._id;
            card.innerHTML = `
                <img src="${exec.imageUrl || 'https://via.placeholder.com/120x120/667eea/ffffff?text=' + exec.name.split(' ').map(w => w[0]).join('').toUpperCase()}" 
                     alt="${exec.name}" class="profile-image">
                <div class="content-body">
                    <h3 class="content-title">${exec.name}</h3>
                    <p class="content-description">${exec.position}</p>
                    <p class="content-description">${exec.bio}</p>
                    <div class="content-actions">
                        <button class="btn btn-sm btn-primary edit-btn" data-id="${exec._id}">Edit</button>
                        <button class="btn btn-sm btn-danger delete-btn" data-id="${exec._id}">Delete</button>
                    </div>
                </div>
            `;
            executivesList.appendChild(card);
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

    // === CREATE EXECUTIVE ===
    async function createExecutive() {
        const name = document.getElementById('executive-name').value.trim();
        const position = document.getElementById('executive-position').value.trim();
        const bio = document.getElementById('executive-bio').value.trim();
        const order = parseInt(document.getElementById('executive-order').value) || 0;
        const fileInput = document.getElementById('executive-photo-file');
        const token = localStorage.getItem('token');

        if (!name || !position) {
            showMessage('Error', 'Name and position are required.');
            return;
        }

        const formData = new FormData();
        formData.append('name', name);
        formData.append('position', position);
        formData.append('bio', bio);
        formData.append('order', order);
        if (fileInput.files[0]) formData.append('image', fileInput.files[0]);

        try {
            const response = await fetch(`${API_BASE}/ex/create`, {
                method: 'POST',
                body: formData,
                credentials: 'include',
                headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
            });

            if (!response.ok) throw new Error('Failed to create executive');
            addExecutiveForm.style.display = 'none';
            showNotification('Success', 'Executive created successfully!');
            await loadExecutives();
        } catch (err) {
            showMessage('Error', err.message || 'Failed to create executive');
        }
    }

    // === EDIT EXECUTIVE ===
    async function openEditModal(id) {
        currentEditId = id;
        try {
            const response = await fetch(`${API_BASE}/ex/${id}`, {
                credentials: 'include'
            });
            if (!response.ok) throw new Error('Failed to fetch executive');
            const exec = await response.json();

            const editForm = `
                <div class="file-upload-area" id="edit-executive-photo-upload">
                    <i class="fas fa-cloud-upload-alt"></i>
                    <p>Drag & drop image here, or click to browse</p>
                    <input type="file" id="edit-executive-photo-file" style="display: none;" accept="image/*">
                    <button class="btn btn-primary" onclick="document.getElementById('edit-executive-photo-file').click()">Browse Image</button>
                </div>
                <div class="file-preview" id="edit-executive-photo-preview">
                    ${exec.imageUrl ? `
                    <div class="file-preview-item">
                        <img src="${exec.imageUrl}">
                        <button class="remove-file"><i class="fas fa-times"></i></button>
                    </div>` : ''}
                </div>
                <div class="row">
                    <div class="form-group col-md-6">
                        <label for="edit-executive-name">Name</label>
                        <input type="text" class="form-control" id="edit-executive-name" value="${exec.name}">
                    </div>
                    <div class="form-group col-md-6">
                        <label for="edit-executive-position">Position</label>
                        <input type="text" class="form-control" id="edit-executive-position" value="${exec.position}">
                    </div>
                    <div class="form-group col-md-6">
                        <label for="edit-executive-order">Order</label>
                        <input type="number" class="form-control" id="edit-executive-order" value="${exec.order || 0}">
                    </div>
                    <div class="form-group col-12">
                        <label for="edit-executive-bio">Bio</label>
                        <textarea class="form-control" id="edit-executive-bio" rows="4">${exec.bio}</textarea>
                    </div>
                </div>
            `;

            editModalContent.innerHTML = editForm;
            editModal.classList.add('active');

            setupFileUpload('edit-executive-photo-file', 'edit-executive-photo-preview');
            setupDragDrop('edit-executive-photo-upload', 'edit-executive-photo-file');

            // Remove image button
            document.querySelectorAll('.remove-file').forEach(btn => {
                btn.onclick = () => {
                    btn.parentElement.remove();
                    document.getElementById('edit-executive-photo-file').value = '';
                };
            });

        } catch (err) {
            showMessage('Error', err.message);
        }
    }

    async function updateExecutive() {
        const name = document.getElementById('edit-executive-name').value.trim();
        const position = document.getElementById('edit-executive-position').value.trim();
        const bio = document.getElementById('edit-executive-bio').value.trim();
        const order = parseInt(document.getElementById('edit-executive-order').value) || 0;
        const fileInput = document.getElementById('edit-executive-photo-file');

        if (!name || !position) {
            showMessage('Error', 'Name and position are required.');
            return;
        }

        const formData = new FormData();
        formData.append('name', name);
        formData.append('position', position);
        formData.append('bio', bio);
        formData.append('order', order);

        if (fileInput.files[0]) {
            formData.append('image', fileInput.files[0]);
            try {
                await fetch(`${API_BASE}/ex/update-image/${currentEditId}`, {
                    method: 'PATCH',
                    body: formData,
                    credentials: 'include'
                });
            } catch (err) {
                showMessage('Error', 'Failed to update image');
                return;
            }
        }

        try {
            const response = await fetch(`${API_BASE}/ex/update/${currentEditId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, position, bio, order }),
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed to update executive');
            editModal.classList.remove('active');
            showNotification('Success', 'Executive updated successfully!');
            await loadExecutives();
        } catch (err) {
            showMessage('Error', err.message);
        }
    }

    // === DELETE EXECUTIVE ===
    function confirmDelete(id) {
        currentEditId = id;
        document.getElementById('confirmationTitle').textContent = 'Delete Executive';
        document.getElementById('confirmationMessage').textContent = 'Are you sure you want to delete this executive? This cannot be undone.';
        confirmationModal.classList.add('active');

        currentAction = async () => {
            try {
                const response = await fetch(`${API_BASE}/ex/delete/${currentEditId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                if (!response.ok) throw new Error('Failed to delete');
                confirmationModal.classList.remove('active');
                showNotification('Success', 'Executive deleted!');
                await loadExecutives();
            } catch (err) {
                showMessage('Error', err.message);
            }
        };
    }

    // === FILE UPLOAD HELPERS ===
    function setupFileUpload(inputId, previewId) {
        const input = document.getElementById(inputId);
        const preview = document.getElementById(previewId);

        input.addEventListener('change', () => {
            preview.innerHTML = '';
            if (input.files.length) {
                const file = input.files[0];
                const reader = new FileReader();
                reader.onload = e => {
                    const item = document.createElement('div');
                    item.className = 'file-preview-item';
                    item.innerHTML = `
                        <img src="${e.target.result}">
                        <button class="remove-file"><i class="fas fa-times"></i></button>
                    `;
                    item.querySelector('.remove-file').onclick = () => {
                        item.remove();
                        input.value = '';
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
        document.getElementById('executive-name').value = '';
        document.getElementById('executive-position').value = '';
        document.getElementById('executive-bio').value = '';
        document.getElementById('executive-order').value = '';
        document.getElementById('executive-photo-preview').innerHTML = '';
        document.getElementById('executive-photo-file').value = '';
    }

    function showMessage(title, message) {
        document.getElementById('messageTitle').textContent = title;
        document.getElementById('messageText').textContent = message;
        messageModal.classList.add('active');
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
        document.getElementById('notificationContainer').appendChild(notif);
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