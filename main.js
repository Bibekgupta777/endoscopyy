const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const fs = require('fs');

// Video optimization
app.commandLine.appendSwitch('disable-features', 'MediaFoundationVideoCapture');
app.disableHardwareAcceleration();

let mainWindow;
let backendProcess;

// LOGGING SETUP: This will save a log file to your Documents folder
const logPath = path.join(app.getPath('documents'), 'endo_app_log.txt');
function logToFile(message) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    },
    icon: path.join(__dirname, 'frontend/public/icon.ico')
  });

  if (app.isPackaged) {
    const indexPath = path.join(__dirname, 'frontend/dist/index.html');
    mainWindow.loadFile(indexPath);
  } else {
    mainWindow.loadURL('http://localhost:3000');
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startBackend() {
  let scriptPath;
  let cwdPath;

  // Clear previous log
  fs.writeFileSync(logPath, "--- APP STARTED ---\n");

  // 1. DETERMINE PATHS
  if (app.isPackaged) {
    // In Production: resources/backend/server.js
    scriptPath = path.join(process.resourcesPath, 'backend', 'server.js');
    cwdPath = path.join(process.resourcesPath, 'backend');
  } else {
    // In Development
    scriptPath = path.join(__dirname, 'backend', 'server.js');
    cwdPath = path.join(__dirname, 'backend');
  }

  logToFile(`Target Script: ${scriptPath}`);

  // 2. CHECK IF FILES EXIST
  if (!fs.existsSync(scriptPath)) {
    logToFile("CRITICAL: server.js not found!");
    dialog.showErrorBox("Error", "Backend server file missing. Reinstall App.");
    return;
  }

  // 3. SETUP UPLOADS FOLDER (AppData is always writable)
  const uploadsDir = path.join(app.getPath('userData'), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  logToFile(`Uploads Directory: ${uploadsDir}`);

  // 4. START BACKEND
  try {
    backendProcess = fork(scriptPath, [], {
      cwd: cwdPath, // Run inside backend folder so it finds node_modules
      env: {
        ...process.env,
        PORT: 5000,
        NODE_ENV: 'production',
        UPLOADS_DIR: uploadsDir
      },
      silent: true // We capture logs manually below
    });

    logToFile("Backend process spawned.");

    // Capture Output
    backendProcess.stdout.on('data', (data) => {
      logToFile(`[SERVER]: ${data}`);
    });

    backendProcess.stderr.on('data', (data) => {
      logToFile(`[SERVER ERROR]: ${data}`);
    });

    backendProcess.on('error', (err) => {
      logToFile(`FAILED TO START: ${err.message}`);
      dialog.showErrorBox("Startup Error", `Backend failed: ${err.message}`);
    });

    backendProcess.on('exit', (code) => {
      logToFile(`Backend exited with code: ${code}`);
      if (code !== 0 && code !== null) {
        // If backend crashes, tell the user why
        dialog.showErrorBox("Backend Crashed", `The database server stopped. \nCheck Documents/endo_app_log.txt`);
      }
    });

  } catch (error) {
    logToFile(`Spawn Exception: ${error.message}`);
    dialog.showErrorBox("Critical Error", error.message);
  }
}

function stopBackend() {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
}

app.whenReady().then(() => {
  startBackend();
  setTimeout(createWindow, 3000);
});

app.on('window-all-closed', () => {
  stopBackend();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  stopBackend();
});