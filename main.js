const { app, BrowserWindow, Tray, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const net = require('net');
const crypto = require('crypto');

const LicenseManager = require('./license/licenseManager');
let licenseManager;

let mainWindow;
let tray;
let backendProcess;
let isQuitting = false;

process.on('unhandledRejection', (reason) => {
  const msg = reason instanceof Error ? reason.message : String(reason);
  console.error('❌ Unhandled Rejection:', msg);
  try {
    fs.appendFileSync(
      path.join(app.getPath('userData'), 'logs', 'app.log'),
      `[${new Date().toISOString()}] UNHANDLED_REJECTION: ${msg}\n`
    );
  } catch (_) {}
});

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

const isDev = !app.isPackaged;

// ✅ Windows 7 32-bit Memory Management
if (process.platform === 'win32') {
  app.commandLine.appendSwitch('js-flags', '--expose-gc --max-old-space-size=512');
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-software-rasterizer');
  app.commandLine.appendSwitch('disable-dev-shm-usage');
  app.commandLine.appendSwitch('disable-gpu-compositing');
}

function getBackendPath() {
  if (isDev) return path.join(__dirname, 'backend');

  const possiblePaths = [
    path.join(process.resourcesPath, 'app.asar.unpacked', 'backend'),
    path.join(process.resourcesPath, 'backend'),
    path.join(process.resourcesPath, 'app', 'backend'),
    path.join(process.resourcesPath, '..', 'backend'),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(path.join(p, 'server.js'))) return p;
  }
  return possiblePaths[0];
}

const BACKEND_PATH = getBackendPath();
const USER_DATA = app.getPath('userData');
const UPLOADS_DIR = path.join(USER_DATA, 'uploads');
const LOGS_DIR = path.join(USER_DATA, 'logs');

function getEnvConfig() {
  const secretPath = path.join(USER_DATA, '.jwt-secret');
  let jwtSecret;

  if (fs.existsSync(secretPath)) {
    jwtSecret = fs.readFileSync(secretPath, 'utf8').trim();
  } else {
    jwtSecret = crypto.randomBytes(32).toString('hex');
    try {
      fs.mkdirSync(path.dirname(secretPath), { recursive: true });
      fs.writeFileSync(secretPath, jwtSecret);
    } catch (e) {}
  }

  return {
    PORT: '5000',
    NODE_ENV: 'production',
    MONGO_URI: 'mongodb://127.0.0.1:27017/endoscopy_database',
    JWT_SECRET: jwtSecret,
    JWT_EXPIRE: '365d',
    UPLOAD_PATH: UPLOADS_DIR,
  };
}

function ensureDirs() {
  const dirs = [
    USER_DATA, UPLOADS_DIR, LOGS_DIR,
    path.join(UPLOADS_DIR, 'endoscopy-images'),
    path.join(UPLOADS_DIR, 'logos'),
    path.join(UPLOADS_DIR, 'signatures')
  ];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
}

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(path.join(LOGS_DIR, 'app.log'), line + '\n');
  } catch (e) {}
}

function checkPort(port) {
  return new Promise(resolve => {
    const socket = new net.Socket();
    socket.setTimeout(2000);
    socket.once('connect', () => { socket.destroy(); resolve(true); });
    socket.once('error', () => { socket.destroy(); resolve(false); });
    socket.once('timeout', () => { socket.destroy(); resolve(false); });
    socket.connect(port, '127.0.0.1');
  });
}

function waitForPort(port, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = async () => {
      if (await checkPort(port)) resolve(true);
      else if (Date.now() - start > timeout) reject(new Error('Timeout'));
      else setTimeout(check, 500);
    };
    check();
  });
}

function killZombiePort(port) {
  try {
    if (process.platform === 'win32') {
      const output = execSync(`netstat -ano | findstr :${port}`).toString();
      const lines = output.split('\n');
      for (let line of lines) {
        if (line.includes(`:${port}`) && line.includes('LISTENING')) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && pid !== '0') {
            log(`🧟 ZOMBIE HUNTER: Found stuck process on port ${port} (PID: ${pid}). Assassinating...`);
            execSync(`taskkill /F /PID ${pid}`, { windowsHide: true });
            log(`✅ ZOMBIE HUNTER: Target neutralized.`);
          }
        }
      }
    }
  } catch (e) {}
}

function tryStartMongoElevated() {
  try {
    log('🔄 Attempting elevated MongoDB service start...');
    execSync(
      'powershell -Command "Start-Process cmd -ArgumentList \'/c net start MongoDB\' -Verb RunAs -Wait -WindowStyle Hidden"',
      { windowsHide: true, timeout: 30000 }
    );
    log('✅ Elevated start command executed.');
    return true;
  } catch (e) {
    const errMsg = e.stderr ? e.stderr.toString().trim() : e.message;
    log(`⚠️ Elevated start failed: ${errMsg}`);
    return false;
  }
}

function trySetMongoAutoStart() {
  try {
    log('🔄 Setting MongoDB service to auto-start...');
    execSync(
      'powershell -Command "Start-Process cmd -ArgumentList \'/c sc config MongoDB start=auto\' -Verb RunAs -Wait -WindowStyle Hidden"',
      { windowsHide: true, timeout: 15000 }
    );
    log('✅ MongoDB service set to auto-start!');
    return true;
  } catch (e) {
    log(`⚠️ Could not set auto-start: ${e.message}`);
    return false;
  }
}

function cleanMongoLockFiles() {
  const possibleDataPaths = [];
  const mongoBase = path.join(process.env['ProgramFiles'] || 'C:\\Program Files', 'MongoDB', 'Server');
  
  if (fs.existsSync(mongoBase)) {
    try {
      const versions = fs.readdirSync(mongoBase);
      for (const ver of versions) {
        const cfgFile = path.join(mongoBase, ver, 'bin', 'mongod.cfg');
        if (fs.existsSync(cfgFile)) {
          try {
            const content = fs.readFileSync(cfgFile, 'utf8');
            const match = content.match(/dbPath:\s*(.+)/i);
            if (match) {
              possibleDataPaths.push(match[1].trim());
              log(`📂 Found dbPath: ${match[1].trim()}`);
            }
          } catch (e) {}
        }
      }
    } catch (e) {}
  }

  possibleDataPaths.push('C:\\data\\db');

  let cleaned = false;
  for (const dataPath of possibleDataPaths) {
    if (!fs.existsSync(dataPath)) continue;
    const lockFile = path.join(dataPath, 'mongod.lock');
    if (fs.existsSync(lockFile)) {
      try {
        const content = fs.readFileSync(lockFile, 'utf8').trim();
        if (content.length > 0) {
          log(`🔓 Clearing stale lock file: ${lockFile}`);
          fs.writeFileSync(lockFile, '');
          cleaned = true;
        }
      } catch (e) {
        try {
          log(`🔓 Lock file needs elevated cleanup: ${lockFile}`);
          execSync(
            `powershell -Command "Start-Process cmd -ArgumentList '/c echo. > \\"${lockFile}\\"' -Verb RunAs -Wait -WindowStyle Hidden"`,
            { windowsHide: true, timeout: 15000 }
          );
          cleaned = true;
          log(`✅ Lock file cleared with elevation.`);
        } catch (e2) {
          log(`⚠️ Could not clean lock file: ${e2.message}`);
        }
      }
    }
  }

  return cleaned;
}

async function checkMongoDB() {
  log('═══════════════════════════════════════════');
  log('🔍 Checking MongoDB on 127.0.0.1:27017...');
  log('═══════════════════════════════════════════');

  let isRunning = await checkPort(27017);
  if (isRunning) {
    log('✅ MongoDB is already running!');
    return true;
  }

  log('⚠️ MongoDB is NOT running. Starting recovery...');
  log('🧹 Step 1: Cleaning stale lock files...');
  cleanMongoLockFiles();

  log('🔄 Step 2: Trying normal service start...');
  try {
    execSync('net start MongoDB', { windowsHide: true, timeout: 15000 });
    log('✅ Service started normally!');
    await new Promise(r => setTimeout(r, 3000));
    isRunning = await checkPort(27017);
    if (isRunning) {
      log('✅ MongoDB is running!');
      return true;
    }
  } catch (e) {
    const errMsg = e.stderr ? e.stderr.toString().trim() : e.message;
    if (errMsg.includes('already been started') || errMsg.includes('already running')) {
      log('ℹ️ MongoDB service is already running.');
      await new Promise(r => setTimeout(r, 2000));
      isRunning = await checkPort(27017);
      if (isRunning) return true;
    }
    log(`⚠️ Normal start failed: ${errMsg}`);
  }

  log('🔄 Step 3: Requesting administrator permission...');
  const elevatedOK = tryStartMongoElevated();

  if (elevatedOK) {
    log('⏳ Waiting for MongoDB to start...');
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 2000));
      isRunning = await checkPort(27017);
      if (isRunning) {
        log(`✅ MongoDB started successfully! (took ${(i + 1) * 2}s)`);
        trySetMongoAutoStart();
        return true;
      }
      if (i % 2 === 0) log(`⏳ Still waiting... (${(i + 1) * 2}s)`);
    }
  }

  isRunning = await checkPort(27017);
  if (isRunning) {
    log('✅ MongoDB is now running!');
    return true;
  }

  log('❌ MongoDB could not be started!');

  const result = dialog.showMessageBoxSync({
    type: 'error',
    title: 'Database Offline',
    message: 'MongoDB database could not be started.',
    detail:
      'Please try these steps:\n\n' +
      '1. Click "Retry" and accept the admin permission popup\n\n' +
      '2. If that fails, open Command Prompt as Administrator and run:\n' +
      '   net start MongoDB\n' +
      '   sc config MongoDB start=auto\n\n' +
      '3. If MongoDB is not installed, please install MongoDB Community Server\n\n' +
      '4. Try restarting your computer',
    buttons: ['Retry', 'Exit'],
    defaultId: 0,
  });

  if (result === 0) return checkMongoDB();
  return false;
}

async function startBackend() {
  log('Starting backend server...');
  killZombiePort(5000);

  const serverPath = path.join(BACKEND_PATH, 'server.js');
  if (!fs.existsSync(serverPath)) return false;

  const envConfig = getEnvConfig();

  return new Promise(resolve => {
    backendProcess = spawn(process.execPath, ['--expose-gc', serverPath], {
      cwd: BACKEND_PATH,
      env: { ...process.env, ...envConfig, ELECTRON_RUN_AS_NODE: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    backendProcess.stdout.on('data', d => log(`[Backend] ${d.toString().trim()}`));
    backendProcess.stderr.on('data', d => log(`[Backend ERROR] ${d.toString().trim()}`));

    backendProcess.on('exit', code => {
      if (!isQuitting) {
        backendProcess = null;
        if (code !== 0) autoRestartBackend();
      }
    });

    waitForPort(5000, 20000)
      .then(() => resolve(true))
      .catch(() => resolve(false));
  });
}

let backendRestartAttempts = 0;
async function autoRestartBackend() {
  if (isQuitting) return;
  backendRestartAttempts++;
  if (backendRestartAttempts > 3) return;
  await new Promise(r => setTimeout(r, 2000));
  const ok = await startBackend();
  if (ok) {
    backendRestartAttempts = 0;
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.reload();
  }
}

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.js');

  mainWindow = new BrowserWindow({
    width: 1400, height: 900, minWidth: 1024, minHeight: 700,
    title: 'EndoSystem',
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    autoHideMenuBar: true, show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: fs.existsSync(preloadPath) ? preloadPath : undefined
    },
  });

  // ✅ Force garbage collection every 3 minutes for Win7 32-bit
  setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      try {
        mainWindow.webContents.executeJavaScript('if (window.gc) window.gc();');
        mainWindow.webContents.session.clearCache();
      } catch (e) {
        log(`GC error: ${e.message}`);
      }
    }
  }, 3 * 60 * 1000);

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadURL('http://127.0.0.1:5000');

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.control && (input.key === '=' || input.key === '+')) {
      mainWindow.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() + 0.5);
    }
    if (input.control && input.key === '-') {
      mainWindow.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() - 0.5);
    }
    if (input.control && input.key === '0') {
      mainWindow.webContents.setZoomLevel(0);
    }
    if (input.control && input.key.toLowerCase() === 'p') {
      event.preventDefault();
      mainWindow.webContents.print({ silent: false, printBackground: true });
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('close', e => {});
  mainWindow.on('closed', () => { mainWindow = null; });

  mainWindow.webContents.on('render-process-gone', () => {
    if (isQuitting) return;
    try { mainWindow.reload(); } catch (_) {}
  });
}

ipcMain.handle('print-page', async () => {
  if (!mainWindow) return { success: false };
  return new Promise((resolve) => {
    mainWindow.webContents.print({ silent: false, printBackground: true }, (success) => resolve({ success }));
  });
});

ipcMain.handle('select-folder', async () => {
  if (!mainWindow) return null;
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Select Destination Folder'
    });
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
  } catch (error) {
    console.error('Folder selection error:', error);
  }
  return null;
});

ipcMain.handle('download-pdf', async (event, { url, folderPath, fileName }) => {
  let hiddenWin = null;
  try {
    return await new Promise((resolve, reject) => {
      hiddenWin = new BrowserWindow({
        show: false,
        width: 1200,
        height: 1600,
        webPreferences: { nodeIntegration: false, contextIsolation: true }
      });

      hiddenWin.loadURL(url);

      hiddenWin.webContents.on('did-finish-load', () => {
        setTimeout(async () => {
          try {
            const pdfData = await hiddenWin.webContents.printToPDF({
              printBackground: true,
              pageSize: 'A4',
              marginsType: 0
            });

            const filePath = path.join(folderPath, fileName);
            fs.writeFileSync(filePath, pdfData);
            resolve(true);
          } catch (err) {
            reject(err);
          }
        }, 3000);
      });

      hiddenWin.webContents.on('did-fail-load', () => {
        reject(new Error('Failed to load hidden window URL'));
      });
    });
  } catch (error) {
    console.error('PDF Engine Error:', error);
    throw error;
  } finally {
    if (hiddenWin && !hiddenWin.isDestroyed()) {
      hiddenWin.destroy();
    }
  }
});

function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'icon.ico');
  if (!fs.existsSync(iconPath)) return;

  tray = new Tray(iconPath);
  tray.setToolTip('EndoSystem');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Open EndoSystem', click: () => { mainWindow?.show(); mainWindow?.focus(); } },
    { type: 'separator' },
    { label: 'Quit', click: () => { isQuitting = true; app.quit(); } }
  ]));
  tray.on('double-click', () => { mainWindow?.show(); mainWindow?.focus(); });
}

function createSplash() {
  const splash = new BrowserWindow({
    width: 400, height: 300, frame: false, transparent: true,
    alwaysOnTop: true, resizable: false, skipTaskbar: true,
  });

  splash.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
    <!DOCTYPE html><html><head><style>
      body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: transparent; -webkit-app-region: drag; user-select: none; }
      .card { background: linear-gradient(145deg, #ffffff, #f8fafc); border-radius: 24px; padding: 40px 36px; text-align: center; width: 360px; box-shadow: 0 25px 60px rgba(0,0,0,0.12); }
      h1 { font-size: 22px; color: #1e293b; margin-bottom: 4px; }
      #status { font-size: 12px; color: #64748b; margin-top:20px; font-weight: 500; }
    </style></head><body>
    <div class="card">
      <h1>EndoSystem</h1>
      <div id="status">Initializing...</div>
    </div></body></html>
  `)}`);
  return splash;
}

function updateSplash(splash, msg) {
  if (splash && !splash.isDestroyed()) {
    splash.webContents.executeJavaScript(`document.getElementById('status').textContent = '${msg}'`).catch(() => {});
  }
}

function cleanup() {
  if (backendProcess) {
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/F', '/T', '/PID', String(backendProcess.pid)], { windowsHide: true });
      } else {
        backendProcess.kill();
      }
    } catch (e) {}
    backendProcess = null;
  }
}

app.whenReady().then(async () => {
  try {
    ensureDirs();
    licenseManager = new LicenseManager();

    if (!licenseManager.isLicensed()) {
      const activated = await licenseManager.showActivationWindow();
      if (!activated) { app.quit(); return; }
    }

    const splash = createSplash();

    updateSplash(splash, 'Checking Database Connection...');
    const mongoOK = await checkMongoDB();
    if (!mongoOK) { if (splash && !splash.isDestroyed()) splash.destroy(); cleanup(); app.quit(); return; }

    updateSplash(splash, 'Starting Local Server...');
    const backendOK = await startBackend();
    if (!backendOK) { if (splash && !splash.isDestroyed()) splash.destroy(); cleanup(); app.quit(); return; }

    updateSplash(splash, 'Opening application...');
    await new Promise(r => setTimeout(r, 800));

    createWindow();
    createTray();

    if (splash && !splash.isDestroyed()) splash.destroy();

  } catch (err) {
    log(`❌ Fatal startup error: ${err.message}`);
    cleanup();
    app.quit();
  }
});

app.on('window-all-closed', () => {
  isQuitting = true;
  cleanup();
  app.quit();
});
app.on('before-quit', () => { isQuitting = true; cleanup(); });
process.on('exit', cleanup);
process.on('SIGINT', () => { isQuitting = true; cleanup(); process.exit(); });
process.on('SIGTERM', () => { isQuitting = true; cleanup(); process.exit(); });