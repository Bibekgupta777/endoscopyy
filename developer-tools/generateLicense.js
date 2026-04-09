const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ══════════════════════════════════════════════════════════════
// USAGE: node generateLicense.js <MACHINE_ID> [client-name]
// ══════════════════════════════════════════════════════════════

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('   🔐 LICENSE KEY GENERATOR');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('   ❌ No Machine ID provided!');
  console.log('');
  console.log('   Usage:');
  console.log('     node generateLicense.js <MACHINE_ID> [client-name]');
  console.log('');
  console.log('   Examples:');
  console.log('     node generateLicense.js A1B2C3D4E5F67890');
  console.log('     node generateLicense.js A1B2C3D4E5F67890 "City Hospital"');
  console.log('     node generateLicense.js A1B2-C3D4-E5F6-7890 "Dr. Smith"');
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  process.exit(1);
}

// Clean machine ID — remove dashes, spaces, make uppercase
const machineId = args[0].replace(/[-\s]/g, '').toUpperCase().trim();
const clientName = args[1] || 'Unknown Client';

// Validate machine ID format
if (machineId.length < 16) {
  console.error('');
  console.error('❌ Invalid Machine ID — too short!');
  console.error('   Expected: 16 hex characters (e.g., A1B2C3D4E5F67890)');
  console.error('   Got:     ', machineId, `(${machineId.length} chars)`);
  console.error('');
  process.exit(1);
}

if (!/^[A-F0-9]+$/i.test(machineId)) {
  console.error('');
  console.error('❌ Invalid Machine ID — must be hex characters only!');
  console.error('   Expected: Only 0-9 and A-F');
  console.error('   Got:     ', machineId);
  console.error('');
  process.exit(1);
}

// Load private key
const privateKeyPath = path.join(__dirname, 'keys', 'private.pem');

if (!fs.existsSync(privateKeyPath)) {
  console.error('');
  console.error('❌ private.pem not found!');
  console.error('   Run this first: node generateKeys.js');
  console.error('   Expected at:', privateKeyPath);
  console.error('');
  process.exit(1);
}

const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

// Sign the machine ID with private key
try {
  const sign = crypto.createSign('SHA256');
  sign.update(machineId);
  sign.end();
  const licenseKey = sign.sign(privateKey, 'base64');

  // Format machine ID for display
  const formattedId = machineId.match(/.{1,4}/g).join('-');

  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('   🔐 LICENSE KEY GENERATED SUCCESSFULLY');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('   Client:      ', clientName);
  console.log('   Machine ID:  ', formattedId);
  console.log('   Date:        ', new Date().toISOString().split('T')[0]);
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('   📋 LICENSE KEY (send this to client):');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log(licenseKey);
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  // Save to log for your records
  const logPath = path.join(__dirname, 'licenses-issued.log');
  const logEntry = [
    `════════════════════════════════════════`,
    `Date:       ${new Date().toISOString()}`,
    `Client:     ${clientName}`,
    `Machine ID: ${machineId}`,
    `License:    ${licenseKey}`,
    `════════════════════════════════════════`,
    '',
  ].join('\n');

  fs.appendFileSync(logPath, logEntry);
  console.log('   📝 Saved to log: ' + logPath);
  console.log('');

} catch (e) {
  console.error('');
  console.error('❌ Failed to generate license:', e.message);
  console.error('');
  process.exit(1);
}