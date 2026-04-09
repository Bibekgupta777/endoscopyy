// const { execSync } = require('child_process');
// const crypto = require('crypto');
// const os = require('os');
// const fs = require('fs');
// const path = require('path');

// /**
//  * Run a wmic command safely — handles Win7 encoding issues
//  */
// function runWmic(command) {
//   try {
//     const raw = execSync(command, {
//       windowsHide: true,
//       timeout: 15000, // 15 seconds for slow Win7 machines
//       stdio: ['pipe', 'pipe', 'pipe'],
//       encoding: 'buffer',
//     });

//     // Convert buffer — try UTF-8 first, then UTF-16LE (Win7 sometimes uses this)
//     let text = raw.toString('utf8');

//     // If we see null bytes, it's UTF-16
//     if (text.includes('\0')) {
//       text = raw.toString('utf16le');
//     }

//     // Clean up — remove BOM, null chars, extra whitespace
//     text = text
//       .replace(/\uFEFF/g, '')
//       .replace(/\0/g, '')
//       .replace(/\r\n/g, '\n')
//       .replace(/\r/g, '\n')
//       .trim();

//     return text;
//   } catch (e) {
//     console.log(`wmic command failed: ${command} - ${e.message}`);
//     return '';
//   }
// }

// /**
//  * Alternative: Run wmic without /format flag (more compatible)
//  */
// function runWmicSimple(query) {
//   try {
//     const raw = execSync(`wmic ${query}`, {
//       windowsHide: true,
//       timeout: 15000,
//       stdio: ['pipe', 'pipe', 'pipe'],
//       encoding: 'buffer',
//     });

//     let text = raw.toString('utf8');
//     if (text.includes('\0')) {
//       text = raw.toString('utf16le');
//     }

//     text = text
//       .replace(/\uFEFF/g, '')
//       .replace(/\0/g, '')
//       .replace(/\r\n/g, '\n')
//       .replace(/\r/g, '\n')
//       .trim();

//     return text;
//   } catch (e) {
//     console.log(`wmic simple query failed: ${query} - ${e.message}`);
//     return '';
//   }
// }

// /**
//  * Extract value from wmic output — handles multiple formats
//  */
// function extractWmicValue(output, key) {
//   if (!output || output.length === 0) return null;

//   const invalid = [
//     'to be filled by o.e.m.',
//     'to be filled by o.e.m',
//     'tobefilled',
//     'default string',
//     'default',
//     'none',
//     'n/a',
//     'na',
//     'not available',
//     'not specified',
//     'chassis serial number',
//     'system serial number',
//     'no asset information',
//     'oem',
//     'o.e.m.',
//     'o.e.m',
//     'unknown',
//     'undefined',
//     'null',
//     '',
//     '0',
//     '0000000000000000',
//   ];

//   // Method 1: Try "Key=Value" format
//   const regex1 = new RegExp(key + '\\s*=\\s*(.+)', 'i');
//   const match1 = output.match(regex1);
//   if (match1 && match1[1]) {
//     const val = match1[1].trim();
//     if (!invalid.includes(val.toLowerCase()) && val.length > 2) {
//       return val;
//     }
//   }

//   // Method 2: Try line-by-line (table format)
//   const lines = output.split('\n').map(l => l.trim()).filter(l => l.length > 0);

//   for (let i = 0; i < lines.length; i++) {
//     const line = lines[i];

//     // Skip header line
//     if (line.toLowerCase().includes(key.toLowerCase())) continue;

//     // Skip common junk
//     if (invalid.includes(line.toLowerCase())) continue;

//     // Valid value found
//     if (line.length > 2 && !/^[\s\-_\.]+$/.test(line)) {
//       return line;
//     }
//   }

//   // Method 3: Just get any alphanumeric string > 4 chars
//   const alphanumMatch = output.match(/[A-Z0-9]{4,}/gi);
//   if (alphanumMatch) {
//     for (const m of alphanumMatch) {
//       if (!invalid.includes(m.toLowerCase()) && m !== key) {
//         return m;
//       }
//     }
//   }

//   return null;
// }

// /**
//  * Get CPU ID using multiple methods
//  */
// function getCpuId() {
//   // Method 1: wmic with /format:value
//   let output = runWmic('wmic cpu get ProcessorId /format:value');
//   let value = extractWmicValue(output, 'ProcessorId');
//   if (value) return value.toUpperCase();

//   // Method 2: wmic without format
//   output = runWmicSimple('cpu get ProcessorId');
//   value = extractWmicValue(output, 'ProcessorId');
//   if (value) return value.toUpperCase();

//   // Method 3: Try alternative property
//   output = runWmic('wmic cpu get DeviceID /format:value');
//   value = extractWmicValue(output, 'DeviceID');
//   if (value) return value.toUpperCase();

//   return null;
// }

// /**
//  * Get Motherboard Serial using multiple methods
//  */
// function getMotherboardSerial() {
//   // Method 1
//   let output = runWmic('wmic baseboard get SerialNumber /format:value');
//   let value = extractWmicValue(output, 'SerialNumber');
//   if (value) return value.toUpperCase();

//   // Method 2
//   output = runWmicSimple('baseboard get SerialNumber');
//   value = extractWmicValue(output, 'SerialNumber');
//   if (value) return value.toUpperCase();

//   // Method 3: Try Product
//   output = runWmic('wmic baseboard get Product /format:value');
//   value = extractWmicValue(output, 'Product');
//   if (value) return value.toUpperCase();

//   return null;
// }

// /**
//  * Get BIOS Serial using multiple methods
//  */
// function getBiosSerial() {
//   // Method 1
//   let output = runWmic('wmic bios get SerialNumber /format:value');
//   let value = extractWmicValue(output, 'SerialNumber');
//   if (value) return value.toUpperCase();

//   // Method 2
//   output = runWmicSimple('bios get SerialNumber');
//   value = extractWmicValue(output, 'SerialNumber');
//   if (value) return value.toUpperCase();

//   // Method 3: BIOS Version as fallback
//   output = runWmic('wmic bios get SMBIOSBIOSVersion /format:value');
//   value = extractWmicValue(output, 'SMBIOSBIOSVersion');
//   if (value) return value.toUpperCase();

//   return null;
// }

// /**
//  * Get Disk Serial using multiple methods
//  */
// function getDiskSerial() {
//   // Method 1
//   let output = runWmic('wmic diskdrive get SerialNumber /format:value');
//   let value = extractWmicValue(output, 'SerialNumber');
//   if (value) return value.toUpperCase();

//   // Method 2
//   output = runWmicSimple('diskdrive get SerialNumber');
//   value = extractWmicValue(output, 'SerialNumber');
//   if (value) return value.toUpperCase();

//   // Method 3: Disk Model as fallback
//   output = runWmic('wmic diskdrive get Model /format:value');
//   value = extractWmicValue(output, 'Model');
//   if (value) return value.toUpperCase();

//   return null;
// }

// /**
//  * Get System UUID
//  */
// function getSystemUuid() {
//   // Method 1
//   let output = runWmic('wmic csproduct get UUID /format:value');
//   let value = extractWmicValue(output, 'UUID');

//   // Filter out invalid UUIDs
//   if (value) {
//     const invalidUuids = [
//       'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF',
//       '00000000-0000-0000-0000-000000000000',
//       'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
//       '00000000000000000000000000000000',
//     ];
//     if (!invalidUuids.includes(value.toUpperCase())) {
//       return value.toUpperCase();
//     }
//   }

//   // Method 2
//   output = runWmicSimple('csproduct get UUID');
//   value = extractWmicValue(output, 'UUID');
//   if (value) return value.toUpperCase();

//   return null;
// }

// /**
//  * Get MAC Address
//  */
// function getMacAddress() {
//   try {
//     const nets = os.networkInterfaces();
//     const skipPatterns = /virtual|vmware|vbox|docker|hyper-v|vethernet|wsl|bluetooth|loopback|pseudo|tunnel/i;

//     // First pass: try to find Ethernet or WiFi
//     for (const name of Object.keys(nets)) {
//       if (skipPatterns.test(name)) continue;

//       for (const net of nets[name]) {
//         if (!net.internal && net.mac && net.mac !== '00:00:00:00:00:00') {
//           return net.mac.toUpperCase().replace(/:/g, '');
//         }
//       }
//     }

//     // Second pass: any valid MAC
//     for (const name of Object.keys(nets)) {
//       for (const net of nets[name]) {
//         if (net.mac && net.mac !== '00:00:00:00:00:00') {
//           return net.mac.toUpperCase().replace(/:/g, '');
//         }
//       }
//     }
//   } catch (e) {
//     console.log('Failed to get MAC address:', e.message);
//   }

//   return null;
// }

// /**
//  * Get Volume Serial Number (C: drive)
//  */
// function getVolumeSerial() {
//   try {
//     const output = execSync('vol C:', {
//       windowsHide: true,
//       timeout: 5000,
//       encoding: 'utf8',
//     });

//     // Format: "Volume Serial Number is XXXX-XXXX"
//     const match = output.match(/[0-9A-F]{4}-[0-9A-F]{4}/i);
//     if (match) {
//       return match[0].replace('-', '').toUpperCase();
//     }
//   } catch (e) {
//     console.log('Failed to get volume serial:', e.message);
//   }

//   return null;
// }

// /**
//  * Get Windows Product ID
//  */
// function getWindowsProductId() {
//   try {
//     const output = runWmic('wmic os get SerialNumber /format:value');
//     const value = extractWmicValue(output, 'SerialNumber');
//     if (value && value.length > 5) {
//       return value.toUpperCase();
//     }
//   } catch (e) {
//     console.log('Failed to get Windows Product ID:', e.message);
//   }

//   return null;
// }

// /**
//  * Get OS Install Date
//  */
// function getOsInstallDate() {
//   try {
//     const output = runWmic('wmic os get InstallDate /format:value');
//     const value = extractWmicValue(output, 'InstallDate');
//     if (value && value.length > 8) {
//       return value.substring(0, 14); // YYYYMMDDHHmmss
//     }
//   } catch (e) {
//     console.log('Failed to get OS install date:', e.message);
//   }

//   return null;
// }

// /**
//  * Read saved Machine ID (persistence fallback)
//  */
// function getSavedMachineId() {
//   try {
//     const appDataPath = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
//     const machineIdPath = path.join(appDataPath, 'endoscopy-system', '.machine-id');

//     if (fs.existsSync(machineIdPath)) {
//       const savedId = fs.readFileSync(machineIdPath, 'utf8').trim();
//       if (savedId && savedId.length === 16 && /^[A-F0-9]+$/.test(savedId)) {
//         return savedId;
//       }
//     }
//   } catch (e) {
//     console.log('Failed to read saved machine ID:', e.message);
//   }

//   return null;
// }

// /**
//  * Save Machine ID (persistence fallback)
//  */
// function saveMachineId(machineId) {
//   try {
//     const appDataPath = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
//     const appFolder = path.join(appDataPath, 'endoscopy-system');
//     const machineIdPath = path.join(appFolder, '.machine-id');

//     if (!fs.existsSync(appFolder)) {
//       fs.mkdirSync(appFolder, { recursive: true });
//     }

//     fs.writeFileSync(machineIdPath, machineId, 'utf8');
//   } catch (e) {
//     console.log('Failed to save machine ID:', e.message);
//   }
// }

// /**
//  * Generate ultimate fallback ID using available system info
//  */
// function generateFallbackId() {
//   const fallbackComponents = [];

//   // Always available
//   fallbackComponents.push('HOST:' + os.hostname().toUpperCase());
//   fallbackComponents.push('ARCH:' + os.arch().toUpperCase());
//   fallbackComponents.push('PLATFORM:' + os.platform().toUpperCase());
//   fallbackComponents.push('RAM:' + os.totalmem().toString());
//   fallbackComponents.push('CPUS:' + os.cpus().length.toString());

//   // CPU model
//   if (os.cpus() && os.cpus().length > 0) {
//     const cpuModel = os.cpus()[0].model.replace(/\s+/g, '_').toUpperCase();
//     fallbackComponents.push('CPUMODEL:' + cpuModel);
//   }

//   // Home directory path (unique per user)
//   fallbackComponents.push('HOME:' + os.homedir().toUpperCase());

//   // Username
//   fallbackComponents.push('USER:' + (os.userInfo().username || 'UNKNOWN').toUpperCase());

//   const combined = fallbackComponents.sort().join('||');
//   const hash = crypto.createHash('sha256').update(combined).digest('hex');

//   return hash.substring(0, 16).toUpperCase();
// }

// /**
//  * Main function: Collects hardware identifiers and returns a unique machine hash.
//  * Compatible with Windows 7 32-bit through Windows 11 64-bit.
//  * GUARANTEED to always return a valid Machine ID.
//  */
// function getHardwareId() {
//   console.log('═══════════════════════════════════════════════════');
//   console.log('   Generating Machine ID...');
//   console.log('═══════════════════════════════════════════════════');

//   const components = [];

//   // ── 1. CPU Processor ID ──
//   const cpuId = getCpuId();
//   if (cpuId) {
//     components.push('CPU:' + cpuId);
//     console.log('   ✓ CPU ID:', cpuId);
//   } else {
//     console.log('   ✗ CPU ID: not available');
//   }

//   // ── 2. Motherboard Serial ──
//   const mbSerial = getMotherboardSerial();
//   if (mbSerial) {
//     components.push('MB:' + mbSerial);
//     console.log('   ✓ Motherboard:', mbSerial);
//   } else {
//     console.log('   ✗ Motherboard: not available');
//   }

//   // ── 3. BIOS Serial ──
//   const biosSerial = getBiosSerial();
//   if (biosSerial) {
//     components.push('BIOS:' + biosSerial);
//     console.log('   ✓ BIOS:', biosSerial);
//   } else {
//     console.log('   ✗ BIOS: not available');
//   }

//   // ── 4. Disk Serial ──
//   const diskSerial = getDiskSerial();
//   if (diskSerial) {
//     components.push('DISK:' + diskSerial);
//     console.log('   ✓ Disk:', diskSerial);
//   } else {
//     console.log('   ✗ Disk: not available');
//   }

//   // ── 5. System UUID ──
//   const uuid = getSystemUuid();
//   if (uuid) {
//     components.push('UUID:' + uuid);
//     console.log('   ✓ UUID:', uuid);
//   } else {
//     console.log('   ✗ UUID: not available');
//   }

//   // ── 6. MAC Address ──
//   const mac = getMacAddress();
//   if (mac) {
//     components.push('MAC:' + mac);
//     console.log('   ✓ MAC:', mac);
//   } else {
//     console.log('   ✗ MAC: not available');
//   }

//   // ── 7. Volume Serial (C: drive) ──
//   const volSerial = getVolumeSerial();
//   if (volSerial) {
//     components.push('VOL:' + volSerial);
//     console.log('   ✓ Volume:', volSerial);
//   } else {
//     console.log('   ✗ Volume: not available');
//   }

//   // ── 8. Windows Product ID ──
//   const winId = getWindowsProductId();
//   if (winId) {
//     components.push('WINID:' + winId);
//     console.log('   ✓ Windows ID:', winId);
//   } else {
//     console.log('   ✗ Windows ID: not available');
//   }

//   console.log('═══════════════════════════════════════════════════');
//   console.log(`   Total hardware components found: ${components.length}`);
//   console.log('═══════════════════════════════════════════════════');

//   // ── Generate Machine ID ──
//   let machineId;

//   if (components.length >= 2) {
//     // Enough hardware info — generate from hardware
//     const combined = components.sort().join('||');
//     const hash = crypto.createHash('sha256').update(combined).digest('hex');
//     machineId = hash.substring(0, 16).toUpperCase();
//     console.log('   ✓ Generated from hardware components');

//   } else if (components.length === 1) {
//     // Only 1 component — add OS info
//     console.log('   ⚠ Only 1 component found — adding OS info...');

//     components.push('HOST:' + os.hostname().toUpperCase());
//     components.push('RAM:' + os.totalmem().toString());

//     const osDate = getOsInstallDate();
//     if (osDate) components.push('OSDATE:' + osDate);

//     const combined = components.sort().join('||');
//     const hash = crypto.createHash('sha256').update(combined).digest('hex');
//     machineId = hash.substring(0, 16).toUpperCase();
//     console.log('   ✓ Generated with OS info added');

//   } else {
//     // No hardware components — check for saved ID first
//     console.log('   ⚠ No hardware components found!');

//     const savedId = getSavedMachineId();
//     if (savedId) {
//       console.log('   ✓ Using previously saved Machine ID');
//       machineId = savedId;

//     } else {
//       // Ultimate fallback
//       console.log('   ⚠ Using ultimate fallback method...');
//       machineId = generateFallbackId();
//       console.log('   ✓ Generated fallback Machine ID');
//     }
//   }

//   // Save Machine ID for future use (helps with consistency)
//   saveMachineId(machineId);

//   console.log('═══════════════════════════════════════════════════');
//   console.log(`   ✅ Machine ID: ${machineId}`);
//   console.log('═══════════════════════════════════════════════════');

//   return machineId;
// }

// /**
//  * Format for display: A1B2C3D4E5F67890 → A1B2-C3D4-E5F6-7890
//  */
// function formatMachineId(id) {
//   if (!id || id.length !== 16) return id;
//   return id.match(/.{1,4}/g).join('-');
// }

// module.exports = { getHardwareId, formatMachineId };



// license/machineId.js
const { execSync } = require('child_process');
const crypto = require('crypto');
const os = require('os');
const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════
// STABLE MACHINE ID GENERATOR
// Fixed: Only uses identifiers that NEVER change across reboots
// Compatible: Windows 7 32-bit through Windows 11 64-bit
// ═══════════════════════════════════════════════════════════

/**
 * Run a wmic command safely — handles Win7/Win10 encoding issues
 */
function runWmic(command) {
  try {
    const raw = execSync(command, {
      windowsHide: true,
      timeout: 15000,
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'buffer',
    });

    let text = raw.toString('utf8');
    if (text.includes('\0')) {
      text = raw.toString('utf16le');
    }

    text = text
      .replace(/\uFEFF/g, '')
      .replace(/\0/g, '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .trim();

    return text;
  } catch (e) {
    console.log(`  wmic command failed: ${command} - ${e.message}`);
    return '';
  }
}

/**
 * Alternative: Run wmic without /format flag (more compatible with Win7)
 */
function runWmicSimple(query) {
  try {
    const raw = execSync(`wmic ${query}`, {
      windowsHide: true,
      timeout: 15000,
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'buffer',
    });

    let text = raw.toString('utf8');
    if (text.includes('\0')) {
      text = raw.toString('utf16le');
    }

    text = text
      .replace(/\uFEFF/g, '')
      .replace(/\0/g, '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .trim();

    return text;
  } catch (e) {
    console.log(`  wmic simple query failed: ${query} - ${e.message}`);
    return '';
  }
}

/**
 * Extract value from wmic output — handles multiple formats
 */
function extractWmicValue(output, key) {
  if (!output || output.length === 0) return null;

  const invalid = [
    'to be filled by o.e.m.', 'to be filled by o.e.m',
    'tobefilled', 'default string', 'default',
    'none', 'n/a', 'na', 'not available', 'not specified',
    'chassis serial number', 'system serial number',
    'no asset information', 'oem', 'o.e.m.', 'o.e.m',
    'unknown', 'undefined', 'null', '', '0',
    '0000000000000000',
  ];

  // Method 1: "Key=Value" format
  const regex1 = new RegExp(key + '\\s*=\\s*(.+)', 'i');
  const match1 = output.match(regex1);
  if (match1 && match1[1]) {
    const val = match1[1].trim();
    if (!invalid.includes(val.toLowerCase()) && val.length > 2) {
      return val;
    }
  }

  // Method 2: Line-by-line (table format)
  const lines = output.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.toLowerCase().includes(key.toLowerCase())) continue;
    if (invalid.includes(line.toLowerCase())) continue;
    if (line.length > 2 && !/^[\s\-_\.]+$/.test(line)) {
      return line;
    }
  }

  // Method 3: Any alphanumeric string > 4 chars
  const alphanumMatch = output.match(/[A-Z0-9]{4,}/gi);
  if (alphanumMatch) {
    for (const m of alphanumMatch) {
      if (!invalid.includes(m.toLowerCase()) && m !== key) {
        return m;
      }
    }
  }

  return null;
}

// ═══════════════════════════════════════════════════════════
// STABLE HARDWARE COLLECTORS (Only things that NEVER change)
// ═══════════════════════════════════════════════════════════

/**
 * ✅ STABLE #1: Registry MachineGuid
 * Changes ONLY on OS reinstall — most reliable on ALL Windows versions
 */
function getRegistryMachineGuid() {
  try {
    const raw = execSync(
      'REG QUERY HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Cryptography /v MachineGuid',
      { encoding: 'utf-8', windowsHide: true, timeout: 5000 }
    );
    const match = raw.match(/MachineGuid\s+REG_SZ\s+(.+)/);
    if (match && match[1]) {
      const guid = match[1].trim();
      if (guid.length > 10) {
        return guid.toUpperCase();
      }
    }
  } catch (e) {
    console.log('  Registry MachineGuid failed:', e.message);
  }
  return null;
}

/**
 * ✅ STABLE #2: CPU Processor ID
 * Burned into CPU hardware — never changes
 */
function getCpuId() {
  let output = runWmic('wmic cpu get ProcessorId /format:value');
  let value = extractWmicValue(output, 'ProcessorId');
  if (value) return value.toUpperCase();

  output = runWmicSimple('cpu get ProcessorId');
  value = extractWmicValue(output, 'ProcessorId');
  if (value) return value.toUpperCase();

  return null;
}

/**
 * ✅ STABLE #3: BIOS/System UUID
 * Written to motherboard firmware — never changes
 */
function getSystemUuid() {
  let output = runWmic('wmic csproduct get UUID /format:value');
  let value = extractWmicValue(output, 'UUID');

  if (value) {
    const invalidUuids = [
      'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF',
      '00000000-0000-0000-0000-000000000000',
      'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
      '00000000000000000000000000000000',
    ];
    if (!invalidUuids.includes(value.toUpperCase())) {
      return value.toUpperCase();
    }
  }

  output = runWmicSimple('csproduct get UUID');
  value = extractWmicValue(output, 'UUID');
  if (value) {
    const invalidUuids = [
      'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF',
      '00000000-0000-0000-0000-000000000000',
    ];
    if (!invalidUuids.includes(value.toUpperCase())) {
      return value.toUpperCase();
    }
  }

  return null;
}

/**
 * ✅ STABLE #4: Motherboard Serial (backup)
 */
function getMotherboardSerial() {
  let output = runWmic('wmic baseboard get SerialNumber /format:value');
  let value = extractWmicValue(output, 'SerialNumber');
  if (value) return value.toUpperCase();

  output = runWmicSimple('baseboard get SerialNumber');
  value = extractWmicValue(output, 'SerialNumber');
  if (value) return value.toUpperCase();

  return null;
}

// ═══════════════════════════════════════════════════════════
// PERSISTENCE: Lock Machine ID on First Run
// ═══════════════════════════════════════════════════════════

function getMachineIdPath() {
  const appDataPath = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
  return path.join(appDataPath, 'endoscopy-system', '.machine-id');
}

function getBackupMachineIdPath() {
  // Second location in case AppData gets cleared
  const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  return path.join(localAppData, 'endoscopy-system', '.machine-id-backup');
}

function getRegistryMachineIdPath() {
  // Third location: Windows Registry (survives app uninstall/reinstall)
  return 'HKEY_CURRENT_USER\\Software\\EndoscopySystem';
}

/**
 * Read saved Machine ID from ALL persistence locations
 */
function getSavedMachineId() {
  // Location 1: AppData/Roaming
  try {
    const primaryPath = getMachineIdPath();
    if (fs.existsSync(primaryPath)) {
      const data = JSON.parse(fs.readFileSync(primaryPath, 'utf8'));
      if (data.machineId && data.machineId.length === 16 && /^[A-F0-9]+$/.test(data.machineId)) {
        console.log('  ✓ Found saved Machine ID (primary)');
        return data;
      }
    }
  } catch (e) {
    console.log('  Primary read failed:', e.message);
  }

  // Location 2: AppData/Local (backup)
  try {
    const backupPath = getBackupMachineIdPath();
    if (fs.existsSync(backupPath)) {
      const data = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
      if (data.machineId && data.machineId.length === 16 && /^[A-F0-9]+$/.test(data.machineId)) {
        console.log('  ✓ Found saved Machine ID (backup)');
        // Restore primary from backup
        saveToPrimary(data);
        return data;
      }
    }
  } catch (e) {
    console.log('  Backup read failed:', e.message);
  }

  // Location 3: Windows Registry
  try {
    const regPath = getRegistryMachineIdPath();
    const output = execSync(`REG QUERY "${regPath}" /v MachineId`, {
      encoding: 'utf-8', windowsHide: true, timeout: 5000
    });
    const match = output.match(/MachineId\s+REG_SZ\s+(.+)/);
    if (match && match[1]) {
      const savedId = match[1].trim();
      if (savedId.length === 16 && /^[A-F0-9]+$/.test(savedId)) {
        console.log('  ✓ Found saved Machine ID (registry)');
        const data = { machineId: savedId, createdAt: 'from-registry' };
        // Restore files from registry
        saveToPrimary(data);
        saveToBackup(data);
        return data;
      }
    }
  } catch (e) {
    // Registry key doesn't exist yet — that's fine
  }

  return null;
}

function saveToPrimary(data) {
  try {
    const filePath = getMachineIdPath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.log('  Primary save failed:', e.message);
  }
}

function saveToBackup(data) {
  try {
    const filePath = getBackupMachineIdPath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.log('  Backup save failed:', e.message);
  }
}

function saveToRegistry(machineId) {
  try {
    const regPath = getRegistryMachineIdPath();
    execSync(`REG ADD "${regPath}" /v MachineId /t REG_SZ /d "${machineId}" /f`, {
      windowsHide: true, timeout: 5000
    });
  } catch (e) {
    console.log('  Registry save failed:', e.message);
  }
}

/**
 * Save Machine ID to ALL THREE locations
 */
function saveMachineId(machineId, components) {
  const data = {
    machineId: machineId,
    components: components,
    createdAt: new Date().toISOString(),
    version: 2,
  };

  saveToPrimary(data);
  saveToBackup(data);
  saveToRegistry(machineId);

  console.log('  ✓ Machine ID saved to 3 locations (file + backup + registry)');
}

/**
 * Verify a saved Machine ID still matches current hardware
 * Allows partial match (2 out of 3 components) for flexibility
 */
function verifySavedId(savedData) {
  if (!savedData || !savedData.components) {
    // Old format without components — trust it (backward compatible)
    return true;
  }

  const saved = savedData.components;
  let matchCount = 0;
  let totalChecked = 0;

  // Check Registry GUID
  if (saved.registryGuid) {
    totalChecked++;
    const current = getRegistryMachineGuid();
    if (current && current === saved.registryGuid) {
      matchCount++;
      console.log('  ✓ Registry GUID matches');
    } else {
      console.log(`  ✗ Registry GUID changed: ${saved.registryGuid} → ${current}`);
    }
  }

  // Check CPU ID
  if (saved.cpuId) {
    totalChecked++;
    const current = getCpuId();
    if (current && current === saved.cpuId) {
      matchCount++;
      console.log('  ✓ CPU ID matches');
    } else {
      console.log(`  ✗ CPU ID changed: ${saved.cpuId} → ${current}`);
    }
  }

  // Check System UUID
  if (saved.systemUuid) {
    totalChecked++;
    const current = getSystemUuid();
    if (current && current === saved.systemUuid) {
      matchCount++;
      console.log('  ✓ System UUID matches');
    } else {
      console.log(`  ✗ System UUID changed: ${saved.systemUuid} → ${current}`);
    }
  }

  // Check Motherboard
  if (saved.motherboard) {
    totalChecked++;
    const current = getMotherboardSerial();
    if (current && current === saved.motherboard) {
      matchCount++;
      console.log('  ✓ Motherboard matches');
    } else {
      console.log(`  ✗ Motherboard changed: ${saved.motherboard} → ${current}`);
    }
  }

  if (totalChecked === 0) return true; // No components saved — trust it

  // ✅ KEY LOGIC: Accept if AT LEAST 2 components match
  // This means if one component glitches, ID still stays stable
  const required = Math.min(2, totalChecked);
  const verified = matchCount >= required;

  console.log(`  Verification: ${matchCount}/${totalChecked} match (need ${required}) → ${verified ? 'PASS ✅' : 'FAIL ❌'}`);

  return verified;
}

// ═══════════════════════════════════════════════════════════
// MAIN FUNCTION
// ═══════════════════════════════════════════════════════════

/**
 * Get a STABLE Machine ID that never changes across reboots.
 * 
 * Strategy:
 *   1. Check saved ID → if it exists AND hardware still matches → return it
 *   2. Generate new ID using ONLY stable components (no MAC, no Volume Serial)
 *   3. Save to 3 locations (AppData, LocalAppData, Registry)
 * 
 * What we DON'T use (because they change on Win10 reboots):
 *   ✗ MAC Address — virtual adapters change order
 *   ✗ Volume Serial — changes after disk checks
 *   ✗ Windows Product ID — changes after activation
 *   ✗ OS Install Date — unreliable
 *   ✗ Hostname — user can rename
 */
function getHardwareId() {
  console.log('═══════════════════════════════════════════════════');
  console.log('   Generating Machine ID (v2 - Stable)...');
  console.log('═══════════════════════════════════════════════════');

  // ── STEP 1: Check for saved Machine ID ──
  const savedData = getSavedMachineId();
  if (savedData && savedData.machineId) {
    console.log(`   Found saved ID: ${savedData.machineId}`);
    console.log('   Verifying against current hardware...');

    if (verifySavedId(savedData)) {
      console.log('═══════════════════════════════════════════════════');
      console.log(`   ✅ Machine ID: ${savedData.machineId} (verified)`);
      console.log('═══════════════════════════════════════════════════');

      // Re-save to all locations (in case one got deleted)
      saveMachineId(savedData.machineId, savedData.components || {});

      return savedData.machineId;
    } else {
      console.log('   ⚠️ Hardware verification failed — regenerating...');
    }
  }

  // ── STEP 2: Collect ONLY stable hardware identifiers ──
  console.log('   Collecting stable hardware identifiers...');

  const collectedComponents = {};
  const hashParts = [];

  // Priority 1: Registry MachineGuid (most reliable across ALL Windows)
  const registryGuid = getRegistryMachineGuid();
  if (registryGuid) {
    collectedComponents.registryGuid = registryGuid;
    hashParts.push('REG:' + registryGuid);
    console.log('   ✓ Registry GUID:', registryGuid);
  } else {
    console.log('   ✗ Registry GUID: not available');
  }

  // Priority 2: CPU Processor ID (hardware-level, never changes)
  const cpuId = getCpuId();
  if (cpuId) {
    collectedComponents.cpuId = cpuId;
    hashParts.push('CPU:' + cpuId);
    console.log('   ✓ CPU ID:', cpuId);
  } else {
    console.log('   ✗ CPU ID: not available');
  }

  // Priority 3: System UUID (motherboard firmware)
  const systemUuid = getSystemUuid();
  if (systemUuid) {
    collectedComponents.systemUuid = systemUuid;
    hashParts.push('UUID:' + systemUuid);
    console.log('   ✓ System UUID:', systemUuid);
  } else {
    console.log('   ✗ System UUID: not available');
  }

  // Priority 4: Motherboard Serial (backup)
  const motherboard = getMotherboardSerial();
  if (motherboard) {
    collectedComponents.motherboard = motherboard;
    hashParts.push('MB:' + motherboard);
    console.log('   ✓ Motherboard:', motherboard);
  } else {
    console.log('   ✗ Motherboard: not available');
  }

  console.log(`   Total stable components: ${hashParts.length}`);

  // ── STEP 3: Generate Machine ID ──
  let machineId;

  if (hashParts.length >= 1) {
    // Sort for consistency, then hash
    const combined = hashParts.sort().join('||');
    const hash = crypto.createHash('sha256').update(combined).digest('hex');
    machineId = hash.substring(0, 16).toUpperCase();
    console.log('   ✓ Generated from', hashParts.length, 'stable components');
  } else {
    // Ultimate fallback — should almost never happen
    console.log('   ⚠️ No hardware components found! Using CPU + RAM fallback...');

    const fallbackParts = [];
    fallbackParts.push('ARCH:' + os.arch());
    fallbackParts.push('RAM:' + os.totalmem().toString());
    fallbackParts.push('CPUS:' + os.cpus().length.toString());
    if (os.cpus()[0]) {
      fallbackParts.push('CPUMODEL:' + os.cpus()[0].model.replace(/\s+/g, ''));
    }

    const combined = fallbackParts.sort().join('||');
    const hash = crypto.createHash('sha256').update(combined).digest('hex');
    machineId = hash.substring(0, 16).toUpperCase();
    console.log('   ✓ Generated from fallback method');
  }

  // ── STEP 4: Save to ALL persistence locations ──
  saveMachineId(machineId, collectedComponents);

  console.log('═══════════════════════════════════════════════════');
  console.log(`   ✅ Machine ID: ${machineId} (new)`);
  console.log('═══════════════════════════════════════════════════');

  return machineId;
}

/**
 * Format for display: A1B2C3D4E5F67890 → A1B2-C3D4-E5F6-7890
 */
function formatMachineId(id) {
  if (!id || id.length !== 16) return id;
  return id.match(/.{1,4}/g).join('-');
}

module.exports = { getHardwareId, formatMachineId };