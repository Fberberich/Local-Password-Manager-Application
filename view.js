const { ipcRenderer } = require('electron');

// Function to display passwords
function displayPasswords(passwords) {
    const passwordList = document.getElementById('password-list');
    const emptyState = document.getElementById('empty-state');
    
    if (passwords.length === 0) {
        passwordList.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    passwordList.innerHTML = '';

    passwords.sort((a, b) => a.service.localeCompare(b.service));

    passwords.forEach(entry => {
        const passwordItem = document.createElement('div');
        passwordItem.className = 'password-item';
        
        // Create a safe version of the service name for IDs (remove spaces and special characters)
        const safeServiceId = entry.service.replace(/[^a-zA-Z0-9]/g, '_');
        
        // Create buttons with event listeners instead of inline onclick
        const showButton = document.createElement('button');
        showButton.className = 'btn-copy';
        showButton.innerHTML = '<span class="button-icon">👁️</span>Show';
        showButton.addEventListener('click', (e) => togglePasswordVisibility(safeServiceId, e));

        const copyButton = document.createElement('button');
        copyButton.className = 'btn-copy';
        copyButton.innerHTML = '<span class="button-icon">📋</span>Copy';
        copyButton.addEventListener('click', () => copyPassword(entry.password, copyButton));

        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn-delete';
        deleteButton.innerHTML = '<span class="button-icon">🗑️</span>Delete';
        deleteButton.addEventListener('click', () => deletePassword(entry.service));
        
        passwordItem.innerHTML = `
            <div class="password-info">
                <h3>${entry.service}</h3>
                <p>${entry.username}</p>
                <div class="password-field">
                    <span class="password-dots" id="pwd-${safeServiceId}">••••••••</span>
                    <span class="password-text" id="text-${safeServiceId}" style="display: none;">${entry.password}</span>
                </div>
            </div>
            <div class="password-actions">
            </div>
        `;
        
        // Add buttons to the actions div
        const actionsDiv = passwordItem.querySelector('.password-actions');
        actionsDiv.appendChild(showButton);
        actionsDiv.appendChild(copyButton);
        actionsDiv.appendChild(deleteButton);
        
        passwordList.appendChild(passwordItem);
    });
}

// Function to copy password
function copyPassword(password, button) {
    navigator.clipboard.writeText(password).then(() => {
        // Create success message
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message success';
        messageDiv.innerHTML = `
            <span style="margin-right: 8px;">✅</span>
            Password copied to clipboard!
        `;
        
        // Remove any existing success messages
        const existingMessages = document.querySelectorAll('.message.success');
        existingMessages.forEach(msg => msg.remove());
        
        // Add the new message
        document.querySelector('.search-container').after(messageDiv);
        
        // Highlight the copy button briefly
        button.style.backgroundColor = '#4ade80';
        button.style.color = 'white';
        
        // Reset button style and remove message after 2 seconds
        setTimeout(() => {
            button.style.backgroundColor = '';
            button.style.color = '';
            messageDiv.remove();
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy password:', err);
        // Show error message
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message error';
        messageDiv.textContent = 'Failed to copy password to clipboard';
        document.querySelector('.search-container').after(messageDiv);
        setTimeout(() => messageDiv.remove(), 2000);
    });
}

// Function to toggle password visibility
function togglePasswordVisibility(serviceId, event) {
    const dots = document.getElementById(`pwd-${serviceId}`);
    const text = document.getElementById(`text-${serviceId}`);
    const button = event.target.closest('button');
    
    if (dots.style.display !== 'none') {
        dots.style.display = 'none';
        text.style.display = 'inline';
        button.innerHTML = '<span class="button-icon">👁️</span>Hide';
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            if (text.style.display !== 'none') {  // Only hide if still visible
                dots.style.display = 'inline';
                text.style.display = 'none';
                button.innerHTML = '<span class="button-icon">👁️</span>Show';
            }
        }, 3000);
    } else {
        // If password is visible, hide it immediately
        dots.style.display = 'inline';
        text.style.display = 'none';
        button.innerHTML = '<span class="button-icon">👁️</span>Show';
    }
}

// Function to delete password
function deletePassword(service) {
    if (confirm('Are you sure you want to delete this password?')) {
        ipcRenderer.send('delete-password', service);
        // Request updated passwords after deletion
        ipcRenderer.send('get-passwords');
    }
}

// Search functionality
function searchPasswords() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    ipcRenderer.send('search-passwords', searchTerm);
}

// Listen for password updates
ipcRenderer.on('passwords-updated', (event, passwords) => {
    displayPasswords(passwords);
});

// Request initial passwords
ipcRenderer.send('get-passwords'); 