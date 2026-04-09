const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { BrowserWindow, ipcMain, app } = require('electron');
const { getHardwareId, formatMachineId } = require('./machineId');

// ══════════════════════════════════════════════════════════════
// 🔑 PUBLIC KEY — REPLACE THIS WITH YOUR ACTUAL PUBLIC KEY
//    from developer-tools/keys/public.pem
//    
//    This is SAFE to ship — it can only VERIFY, not CREATE licenses
// ══════════════════════════════════════════════════════════════
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAojNIAaAKKdIiTUrQxwKN
+LqrOonTtcJgb9ufesMkreCgmpy/0USyE8g542d0fX79A8xarZD4t4NleDf5bo26
UaZyZEPbUNIAkD9LaDjapZmXN1YwJklYOu4aCdwliNj7wp6T1fGd4T5fEMV+qmLj
0NK3MX37C7lcEQo+DYN13dcyp5ljAL9Qp9s2WDewI4lZmDHXjngUIt/uhhYfcd5T
369VlJL3+n1ATjjLDz5ps3oRj70dutTXkY04LAx1cDDQbRrMC4R+OrMvCHLW9DR/
5/tC6kzfX6rfEgpj72HhcjgShB0tF1Zyz58q9XE00SkNUs8nmdiKGsMCMsPrt14H
HwIDAQAB
-----END PUBLIC KEY-----`;
// ══════════════════════════════════════════════════════════════


class LicenseManager {

  constructor() {
    this.machineId = null;
    this.licensePath = path.join(app.getPath('userData'), '.license.enc');
  }

  // ══════════════════════════════════════════════
  // Get current machine's hardware ID
  // ══════════════════════════════════════════════
  getMachineId() {
    if (!this.machineId) {
      this.machineId = getHardwareId();
    }
    return this.machineId;
  }

  // ══════════════════════════════════════════════
  // Verify a license key using RSA public key
  // ══════════════════════════════════════════════
  verifySignature(machineId, licenseKey) {
    try {
      const verify = crypto.createVerify('SHA256');
      verify.update(machineId);
      verify.end();
      return verify.verify(PUBLIC_KEY, licenseKey, 'base64');
    } catch (e) {
      console.error('Signature verification error:', e.message);
      return false;
    }
  }

  // ══════════════════════════════════════════════
  // Check if app is currently licensed
  // ══════════════════════════════════════════════
  isLicensed() {
    try {
      // Check if license file exists
      if (!fs.existsSync(this.licensePath)) {
        return false;
      }

      // Read and decrypt license file
      const encrypted = fs.readFileSync(this.licensePath, 'utf8');
      const data = this._decrypt(encrypted);

      if (!data) {
        console.log('❌ Could not decrypt license file');
        return false;
      }

      // Parse license data
      const license = JSON.parse(data);

      // Get current machine ID
      const currentMachineId = this.getMachineId();

      // Check machine ID matches
      if (license.machineId !== currentMachineId) {
        console.log('❌ License machine ID mismatch');
        console.log('   License for:', license.machineId);
        console.log('   Current:    ', currentMachineId);
        return false;
      }

      // Verify RSA signature
      if (!this.verifySignature(license.machineId, license.licenseKey)) {
        console.log('❌ License signature is invalid');
        return false;
      }

      console.log('✅ License is valid for this machine');
      return true;

    } catch (e) {
      console.error('❌ License check error:', e.message);
      return false;
    }
  }

  // ══════════════════════════════════════════════
  // Activate with a license key
  // ══════════════════════════════════════════════
  activate(licenseKey) {
    try {
      const machineId = this.getMachineId();
      const cleanKey = licenseKey.trim();

      // Verify the key was signed by our private key for THIS machine
      if (!this.verifySignature(machineId, cleanKey)) {
        console.log('❌ Invalid license key for this machine');
        return false;
      }

      // Create license data
      const data = JSON.stringify({
        machineId: machineId,
        licenseKey: cleanKey,
        activatedAt: new Date().toISOString(),
        v: 1,
      });

      // Encrypt and save
      const encrypted = this._encrypt(data);

      // Ensure directory exists
      const dir = path.dirname(this.licensePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(this.licensePath, encrypted, 'utf8');

      console.log('✅ License activated and saved successfully');
      return true;

    } catch (e) {
      console.error('❌ Activation error:', e.message);
      return false;
    }
  }

  // ══════════════════════════════════════════════
  // Show the activation window UI
  // ══════════════════════════════════════════════
  showActivationWindow() {
    return new Promise((resolve) => {

      // Get machine ID
      let machineId;
      try {
        machineId = this.getMachineId();
      } catch (e) {
        console.error('❌ Could not get machine ID:', e.message);
        resolve(false);
        return;
      }

      const formattedId = formatMachineId(machineId);

      // Unique channel ID for IPC (prevents conflicts if called multiple times)
      const channel = 'lic-' + Date.now();

      // Create activation window
      const win = new BrowserWindow({
        width: 520,
        height: 520,
        frame: false,
        resizable: false,
        alwaysOnTop: true,
        transparent: true,
        skipTaskbar: false,
        center: true,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
        },
      });

      // Track if we already resolved
      let resolved = false;

      const finish = (val) => {
        if (resolved) return;
        resolved = true;

        // Cleanup IPC listeners
        ipcMain.removeAllListeners(channel + '-activate');
        ipcMain.removeAllListeners(channel + '-quit');
        ipcMain.removeAllListeners(channel + '-copy');

        resolve(val);
      };

      // ── IPC: Copy machine ID to clipboard ──
      ipcMain.on(channel + '-copy', () => {
        try {
          const { clipboard } = require('electron');
          clipboard.writeText(machineId);
        } catch (_) {}
      });

      // ── IPC: Activate button clicked ──
      ipcMain.on(channel + '-activate', (event, key) => {
        const success = this.activate(key);
        event.reply(channel + '-result', success);

        if (success) {
          setTimeout(() => {
            if (!win.isDestroyed()) win.close();
            finish(true);
          }, 1500);
        }
      });

      // ── IPC: Quit button clicked ──
      ipcMain.on(channel + '-quit', () => {
        if (!win.isDestroyed()) win.close();
        finish(false);
      });

      // ── Window closed (X button or alt+f4) ──
      win.on('closed', () => {
        finish(false);
      });

      // Load the activation UI
      const html = this._getActivationHTML(formattedId, machineId, channel);
      win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
    });
  }


  // ══════════════════════════════════════════════
  // PRIVATE: Encrypt data
  // ══════════════════════════════════════════════
  _encrypt(text) {
    const salt = this.getMachineId() + '-endosys-protection-2024';
    const key = crypto.createHash('sha256').update(salt).digest();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let enc = cipher.update(text, 'utf8', 'hex');
    enc += cipher.final('hex');
    return iv.toString('hex') + ':' + enc;
  }

  // ══════════════════════════════════════════════
  // PRIVATE: Decrypt data
  // ══════════════════════════════════════════════
  _decrypt(text) {
    try {
      const salt = this.getMachineId() + '-endosys-protection-2024';
      const key = crypto.createHash('sha256').update(salt).digest();
      const parts = text.split(':');
      if (parts.length !== 2) return null;
      const iv = Buffer.from(parts[0], 'hex');
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let dec = decipher.update(parts[1], 'hex', 'utf8');
      dec += decipher.final('utf8');
      return dec;
    } catch (_) {
      return null;
    }
  }

  // ══════════════════════════════════════════════
  // PRIVATE: Activation Window HTML
  // ══════════════════════════════════════════════
  _getActivationHTML(formattedId, rawId, channel) {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family:'Segoe UI',system-ui,-apple-system,sans-serif;
    display:flex; align-items:center; justify-content:center;
    height:100vh; background:transparent;
    -webkit-app-region:drag; user-select:none;
  }
  .card {
    background:linear-gradient(145deg,#ffffff,#f8fafc);
    border-radius:24px; padding:36px; text-align:center;
    width:480px;
    box-shadow: 0 25px 60px rgba(0,0,0,0.15),
                0 0 0 1px rgba(0,0,0,0.05);
  }
  .icon-wrap {
    width:60px;height:60px;margin:0 auto 16px;
    background:linear-gradient(135deg,#ef4444,#f97316);
    border-radius:16px;display:flex;
    align-items:center;justify-content:center;
    box-shadow:0 8px 24px rgba(239,68,68,0.3);
  }
  .icon-wrap svg{width:28px;height:28px;fill:white}
  h1{font-size:20px;font-weight:700;color:#1e293b;margin-bottom:4px}
  .sub{font-size:13px;color:#94a3b8;margin-bottom:22px}
  
  .mid-box{
    background:#f1f5f9;
    border:2px dashed #cbd5e1;
    border-radius:12px;padding:16px;margin-bottom:18px;
  }
  .mid-label{
    font-size:10px;color:#64748b;margin-bottom:8px;
    text-transform:uppercase;letter-spacing:1.5px;font-weight:600;
  }
  .mid-value{
    font-size:20px;font-weight:700;color:#1e293b;
    font-family:'Consolas','Courier New',monospace;letter-spacing:3px;
  }
  .copy-btn{
    -webkit-app-region:no-drag;
    background:#e2e8f0;border:none;padding:6px 18px;
    border-radius:6px;font-size:11px;color:#475569;
    cursor:pointer;margin-top:10px;transition:all 0.2s;font-weight:500;
  }
  .copy-btn:hover{background:#cbd5e1}
  .copy-btn:active{transform:scale(0.97)}
  
  .input-group{margin:18px 0;text-align:left}
  .input-group label{
    font-size:12px;color:#64748b;margin-bottom:6px;
    display:block;font-weight:600;
  }
  .input-group textarea{
    -webkit-app-region:no-drag;
    width:100%;padding:12px 14px;
    border:2px solid #e2e8f0;
    border-radius:10px;font-size:13px;outline:none;
    transition:border-color 0.2s;resize:none;
    font-family:'Consolas','Courier New',monospace;
    height:75px;background:#fafbfc;
  }
  .input-group textarea:focus{border-color:#3b82f6;background:white}
  .input-group textarea::placeholder{color:#94a3b8;font-family:'Segoe UI',sans-serif}
  
  .btn-row{display:flex;gap:10px;margin-top:18px}
  .btn{
    -webkit-app-region:no-drag;
    flex:1;padding:12px;border:none;border-radius:10px;
    font-size:14px;font-weight:600;cursor:pointer;
    transition:all 0.2s;
  }
  .btn:active{transform:scale(0.98)}
  .btn-activate{
    background:linear-gradient(135deg,#3b82f6,#8b5cf6);
    color:white;
  }
  .btn-activate:hover{
    transform:translateY(-1px);
    box-shadow:0 4px 16px rgba(59,130,246,0.4);
  }
  .btn-activate:disabled{
    opacity:0.5;transform:none;
    box-shadow:none;cursor:not-allowed;
  }
  .btn-quit{background:#f1f5f9;color:#64748b}
  .btn-quit:hover{background:#e2e8f0}
  
  #status{
    margin-top:14px;font-size:12px;
    min-height:24px;font-weight:500;
    transition:all 0.3s;
  }
  .err{color:#ef4444}
  .ok{color:#22c55e}
  .wait{color:#3b82f6}
  
  .hint{
    font-size:11px;color:#94a3b8;margin-top:14px;
    line-height:1.6;
  }
</style>
</head>
<body>
<div class="card">

  <div class="icon-wrap">
    <svg viewBox="0 0 24 24">
      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
    </svg>
  </div>

  <h1>EndoSystem — License Required</h1>
  <p class="sub">This software requires activation to run on this computer</p>

  <div class="mid-box">
    <div class="mid-label">Your Machine ID</div>
    <div class="mid-value">${formattedId}</div>
    <button class="copy-btn" id="copyBtn" onclick="copyId()">📋 Copy Machine ID</button>
  </div>

  <div class="input-group">
    <label>Enter License Key</label>
    <textarea id="keyInput" placeholder="Paste the license key you received here..." spellcheck="false"></textarea>
  </div>

  <div class="btn-row">
    <button class="btn btn-quit" onclick="quitApp()">✕ Quit</button>
    <button class="btn btn-activate" id="actBtn" onclick="activate()">🔓 Activate License</button>
  </div>

  <div id="status"></div>

  <div class="hint">
    📧 Send the Machine ID to your software provider.<br/>
    They will generate a unique license key for this computer.
  </div>

</div>

<script>
  const { ipcRenderer } = require('electron');

  function copyId() {
    ipcRenderer.send('${channel}-copy');
    const btn = document.getElementById('copyBtn');
    btn.textContent = '✅ Copied!';
    btn.style.background = '#dcfce7';
    btn.style.color = '#16a34a';
    setTimeout(() => {
      btn.textContent = '📋 Copy Machine ID';
      btn.style.background = '';
      btn.style.color = '';
    }, 2500);
  }

  function activate() {
    const key = document.getElementById('keyInput').value.trim();
    const status = document.getElementById('status');
    const btn = document.getElementById('actBtn');

    if (!key) {
      status.innerHTML = '<span class="err">⚠️ Please paste a license key first</span>';
      document.getElementById('keyInput').focus();
      return;
    }

    if (key.length < 20) {
      status.innerHTML = '<span class="err">⚠️ License key seems too short — check if you copied it completely</span>';
      return;
    }

    status.innerHTML = '<span class="wait">⏳ Validating license key...</span>';
    btn.disabled = true;

    ipcRenderer.send('${channel}-activate', key);
  }

  ipcRenderer.on('${channel}-result', (event, success) => {
    const status = document.getElementById('status');
    const btn = document.getElementById('actBtn');

    if (success) {
      status.innerHTML = '<span class="ok">✅ License activated successfully! Starting application...</span>';
      btn.textContent = '✅ Activated!';
    } else {
      status.innerHTML = '<span class="err">❌ Invalid license key for this computer. Please check and try again.</span>';
      btn.disabled = false;
    }
  });

  function quitApp() {
    ipcRenderer.send('${channel}-quit');
  }

  // Allow Enter to activate
  document.getElementById('keyInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      activate();
    }
  });

  // Auto-focus input
  setTimeout(() => {
    document.getElementById('keyInput').focus();
  }, 500);
</script>
</body>
</html>`;
  }
}

module.exports = LicenseManager;