const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('');
console.log('═══════════════════════════════════════════════════');
console.log('   🔐 RSA KEY PAIR GENERATOR');
console.log('═══════════════════════════════════════════════════');
console.log('');

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const keysDir = path.join(__dirname, 'keys');
if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir, { recursive: true });
}

fs.writeFileSync(path.join(keysDir, 'public.pem'), publicKey);
fs.writeFileSync(path.join(keysDir, 'private.pem'), privateKey);

console.log('✅ Keys generated successfully!');
console.log('');
console.log('📂 Saved to:', keysDir);
console.log('');
console.log('═══════════════════════════════════════════════════');
console.log('   ⚠️  IMPORTANT INSTRUCTIONS');
console.log('═══════════════════════════════════════════════════');
console.log('');
console.log('   1. Copy the PUBLIC KEY below');
console.log('   2. Open license/licenseManager.js');
console.log('   3. Replace the PUBLIC_KEY variable with it');
console.log('');
console.log('   4. KEEP private.pem SECRET — NEVER ship with app');
console.log('   5. BACKUP both keys — if you lose private.pem');
console.log('      you can NEVER generate new licenses');
console.log('');
console.log('═══════════════════════════════════════════════════');
console.log('   📋 PUBLIC KEY (copy everything below)');
console.log('═══════════════════════════════════════════════════');
console.log('');
console.log(publicKey);
console.log('═══════════════════════════════════════════════════');
console.log('');