const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const fs = require('fs');

// Video optimization
app.commandLine.appendSwitch('disable-features', 'MediaFoundationVideoCapture');
app.disableHardwareAcceleration();

let mainWindow;
let backendProcess;

// LOGGING SETUP
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
    icon: path.join(__dirname, 'frontend/public/icon.ico'),
    autoHideMenuBar: true
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

  fs.writeFileSync(logPath, "--- APP STARTED ---\n");

  if (app.isPackaged) {
    scriptPath = path.join(process.resourcesPath, 'backend', 'server.js');
    cwdPath = path.join(process.resourcesPath, 'backend');
  } else {
    scriptPath = path.join(__dirname, 'backend', 'server.js');
    cwdPath = path.join(__dirname, 'backend');
  }

  logToFile(`Target Script: ${scriptPath}`);

  if (!fs.existsSync(scriptPath)) {
    logToFile("CRITICAL: server.js not found!");
    dialog.showErrorBox("Error", "Backend server file missing. Reinstall App.");
    return;
  }

  const uploadsDir = path.join(app.getPath('userData'), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  try {
    backendProcess = fork(scriptPath, [], {
      cwd: cwdPath,
      env: {
        ...process.env,
        PORT: 5000,
        NODE_ENV: 'production',
        UPLOADS_DIR: uploadsDir
      },
      silent: true 
    });

    logToFile("Backend process spawned.");

    backendProcess.stdout.on('data', (data) => logToFile(`[SERVER]: ${data}`));
    backendProcess.stderr.on('data', (data) => logToFile(`[SERVER ERROR]: ${data}`));

    backendProcess.on('error', (err) => {
      logToFile(`FAILED TO START: ${err.message}`);
      dialog.showErrorBox("Startup Error", `Backend failed: ${err.message}`);
    });

    backendProcess.on('exit', (code) => {
      logToFile(`Backend exited with code: ${code}`);
      if (code !== 0 && code !== null) {
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
  // Wait 2 seconds for backend to boot before opening window
  setTimeout(createWindow, 2000);
});

app.on('window-all-closed', () => {
  stopBackend();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  stopBackend();
});