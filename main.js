const { app, BrowserWindow, ipcMain } = require('electron')
const fs = require('fs')
const path = require('path')

let mainWindow
const DB_FILE = path.join(app.getPath('userData'), 'passwords.json')

// Initialize database if it doesn't exist
function initializeDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([]))
  }
}

// Read passwords from database
function readPasswords() {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading passwords:', error)
    return []
  }
}

// Write passwords to database
function writePasswords(passwords) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(passwords, null, 2))
  } catch (error) {
    console.error('Error writing passwords:', error)
  }
}

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  mainWindow.loadFile('index.html')
}

app.whenReady().then(() => {
  initializeDB()
  createWindow()
})

// Handle IPC messages
ipcMain.on('save-password', (event, passwordData) => {
  const passwords = readPasswords()
  passwords.push(passwordData)
  writePasswords(passwords)
  event.reply('passwords-updated', passwords)
})

ipcMain.on('get-passwords', (event) => {
  const passwords = readPasswords()
  event.reply('passwords-updated', passwords)
})

ipcMain.on('search-passwords', (event, searchTerm) => {
  const passwords = readPasswords()
  const filteredPasswords = passwords.filter(pwd => 
    pwd.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pwd.username.toLowerCase().includes(searchTerm.toLowerCase())
  )
  event.reply('passwords-updated', filteredPasswords)
})

ipcMain.on('delete-password', (event, service) => {
  const passwords = readPasswords()
  const updatedPasswords = passwords.filter(pwd => pwd.service !== service)
  writePasswords(updatedPasswords)
  event.reply('passwords-updated', updatedPasswords)
})

ipcMain.on('clear-passwords', (event) => {
  writePasswords([])
  event.reply('passwords-updated', [])
})