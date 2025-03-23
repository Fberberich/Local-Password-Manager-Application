const { ipcRenderer } = require('electron');

// Show/hide tabs
function showTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Load passwords when switching to view tab
    if (tabName === 'view') {
        loadPasswords();
    }
}

// Toggle password visibility in the form
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleButton = document.querySelector('.toggle-password');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleButton.textContent = 'Hide';
    } else {
        passwordInput.type = 'password';
        toggleButton.textContent = 'Show';
    }
}

// Handle form submission
document.getElementById('password-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const service = document.getElementById('service').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Send data to main process
    ipcRenderer.send('save-password', { service, username, password });

    // Show success message
    const successMessage = document.getElementById('success-message');
    successMessage.style.display = 'block';
    setTimeout(() => {
        successMessage.style.display = 'none';
    }, 3000);

    // Clear form
    e.target.reset();
});

// Function to load passwords
function loadPasswords() {
    ipcRenderer.send('get-passwords');
}

// Search passwords
function searchPasswords() {
    const searchTerm = document.getElementById('search').value.toLowerCase();
    ipcRenderer.send('search-passwords', searchTerm);
}

// Function to copy password
function copyPassword(password) {
    navigator.clipboard.writeText(password).then(() => {
        alert('Password copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy password:', err);
    });
}

// Function to toggle password visibility in the list
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

// Listen for password updates
ipcRenderer.on('passwords-updated', (event, passwords) => {
    const passwordList = document.getElementById('password-list');
    passwordList.innerHTML = '';

    passwords.sort((a, b) => a.service.localeCompare(b.service));

    passwords.forEach(entry => {
        const passwordItem = document.createElement('div');
        passwordItem.className = 'password-item';
        
        // Create a safe version of the service name for IDs
        const safeServiceId = entry.service.replace(/[^a-zA-Z0-9]/g, '_');
        
        // Create buttons with event listeners
        const showButton = document.createElement('button');
        showButton.className = 'btn-copy';
        showButton.innerHTML = '<span class="button-icon">👁️</span>Show';
        showButton.addEventListener('click', (e) => togglePasswordVisibility(safeServiceId, e));

        const copyButton = document.createElement('button');
        copyButton.className = 'btn-copy';
        copyButton.innerHTML = '<span class="button-icon">📋</span>Copy';
        copyButton.addEventListener('click', () => copyPassword(entry.password));
        
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
        
        passwordList.appendChild(passwordItem);
    });
});

// Request initial passwords if we're on the view tab
if (document.getElementById('view-tab').classList.contains('active')) {
    loadPasswords();
} 