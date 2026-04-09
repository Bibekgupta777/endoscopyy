// /**
//  * ══════════════════════════════════════════════════════════════
//  * 🏗️ BUILD SCRIPT: Windows 10/11 (64-bit) Installer
//  * Uses latest Electron v41 for best performance
//  * ══════════════════════════════════════════════════════════════
//  */

// const { execSync } = require('child_process');
// const fs = require('fs');
// const path = require('path');

// console.log('═══════════════════════════════════════════════════');
// console.log('🏗️  Building EndoSystem for Windows 10/11 (64-bit)');
// console.log('    Using Electron v41 (latest)');
// console.log('═══════════════════════════════════════════════════');

// const pkgPath = path.join(__dirname, 'package.json');
// const originalPkg = fs.readFileSync(pkgPath, 'utf8');
// const pkg = JSON.parse(originalPkg);

// // Force 64-bit only for this build
// pkg.build.win.target = [
//   {
//     target: 'nsis',
//     arch: ['x64']
//   }
// ];

// // Change artifact name to clearly label it
// pkg.build.nsis.artifactName = 'EndoSystem-Setup-${version}-Win10-11-64bit.${ext}';

// fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
// console.log('✅ package.json updated for Win10/11 build');

// try {
//   // Verify current Electron version
//   const version = execSync('npx electron --version').toString().trim();
//   console.log(`✅ Electron version: ${version}`);

//   // Build frontend
//   console.log('🔨 Building frontend...');
//   execSync('cd frontend && npm run build', { stdio: 'inherit' });

//   // Build Win10/11 64-bit installer
//   console.log('🔨 Building Win10/11 64-bit installer...');
//   execSync('npx electron-builder --win --x64', { stdio: 'inherit' });

//   console.log('═══════════════════════════════════════════════════');
//   console.log('✅ Win10/11 64-bit build COMPLETE!');
//   console.log('   Output: release/EndoSystem-Setup-1.0.0-Win10-11-64bit.exe');
//   console.log('═══════════════════════════════════════════════════');

// } catch (error) {
//   console.error('❌ Build failed:', error.message);
// } finally {
//   // ALWAYS restore original package.json
//   console.log('🔄 Restoring original package.json...');
//   fs.writeFileSync(pkgPath, originalPkg);
//   console.log('✅ package.json restored');
// }


/**
 * ══════════════════════════════════════════════════════════════
 * 🏗️ BUILD SCRIPT: Windows 10/11 (64-bit) Installer
 * Uses latest Electron
 * ══════════════════════════════════════════════════════════════
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('═══════════════════════════════════════════════════');
console.log('🏗️  Building EndoSystem for Windows 10/11 (64-bit)');
console.log('    Using Electron v41 (latest)');
console.log('═══════════════════════════════════════════════════');

// Step 1: Save current package.json
const pkgPath = path.join(__dirname, 'package.json');
const originalPkg = fs.readFileSync(pkgPath, 'utf8');
const pkg = JSON.parse(originalPkg);

// Force 64-bit for this build
pkg.build.win.target = [
  {
    target: 'nsis',
    arch: ['x64']
  }
];

// Change artifact name
pkg.build.nsis.artifactName = 'EndoSystem-Setup-${version}-Win10-11-64bit.${ext}';

// ═══════════════════════════════════════════════════════════════
// 🔥 EXCLUDE Puppeteer from Win10/11 build too (we use Electron PDF)
// ═══════════════════════════════════════════════════════════════
pkg.build.files = [
  "main.js",
  "preload.js",
  "package.json",
  "assets/**/*",
  "license/**/*",
  "backend/**/*",
  "frontend/dist/**/*",
  
  // ❌ EXCLUDE: Puppeteer not needed (using Electron's printToPDF)
  "!**/puppeteer/**",
  "!**/puppeteer-core/**",
  "!**/.local-chromium/**",
  "!**/chromium/**",
  "!**/html-pdf-node/**",
  "!**/chrome-win/**",
  "!**/chrome-linux/**",
  "!**/chrome-mac/**",
  
  // ❌ EXCLUDE: Development junk
  "!backend/node_modules/.cache/**",
  "!backend/uploads/**",
  "!**/*.map",
  "!**/node_modules/*/{CHANGELOG.md,README.md,readme.md}",
  "!**/node_modules/*/{test,__tests__,tests,example,examples}",
  "!**/node_modules/*.d.ts",
  "!**/node_modules/.bin",
  "!**/node_modules/**/*.md",
  "!**/node_modules/**/*.ts",
  "!**/node_modules/**/*.map",
  "!developer-tools/**/*"
];

pkg.build.asarUnpack = [
  "backend/**/*",
  "frontend/dist/**/*",
  "!**/puppeteer/**",
  "!**/.local-chromium/**",
  "!**/html-pdf-node/**"
];

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
console.log('✅ package.json updated for Win10/11 build');

// Cleanup function
const cleanupPuppeteer = () => {
  const puppeteerPaths = [
    path.join(__dirname, 'backend', 'node_modules', 'puppeteer'),
    path.join(__dirname, 'backend', 'node_modules', 'puppeteer-core'),
    path.join(__dirname, 'backend', 'node_modules', '.local-chromium'),
    path.join(__dirname, 'backend', 'node_modules', 'html-pdf-node'),
  ];
  
  puppeteerPaths.forEach(p => {
    if (fs.existsSync(p)) {
      console.log(`🗑️  Removing: ${path.basename(p)}`);
      try {
        fs.rmSync(p, { recursive: true, force: true });
      } catch (e) {
        console.warn(`   ⚠️ Could not remove ${p}`);
      }
    }
  });
};

try {
  // Clean up Puppeteer
  console.log('🧹 Cleaning up unnecessary dependencies...');
  cleanupPuppeteer();

  // Verify Electron version
  const version = execSync('npx electron --version').toString().trim();
  console.log(`✅ Electron version: ${version}`);

  // Clean backend
  console.log('🧹 Cleaning backend...');
  try {
    const backendPath = path.join(__dirname, 'backend');
    execSync('npm uninstall html-pdf-node puppeteer 2>nul || true', { 
      cwd: backendPath, 
      stdio: 'pipe',
      shell: true 
    });
  } catch (e) {}
  cleanupPuppeteer();

  // Build frontend
  console.log('🔨 Building frontend...');
  execSync('cd frontend && npm run build', { stdio: 'inherit' });

  // Build Win10/11 64-bit installer
  console.log('🔨 Building Win10/11 64-bit installer...');
  execSync('npx electron-builder --win --x64', { stdio: 'inherit' });

  // Check output size
  const outputPath = path.join(__dirname, 'release', 'EndoSystem-Setup-1.0.0-Win10-11-64bit.exe');
  if (fs.existsSync(outputPath)) {
    const stats = fs.statSync(outputPath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);
    console.log(`📊 Installer size: ${sizeMB} MB`);
  }

  console.log('═══════════════════════════════════════════════════');
  console.log('✅ Win10/11 64-bit build COMPLETE!');
  console.log('   Output: release/EndoSystem-Setup-1.0.0-Win10-11-64bit.exe');
  console.log('═══════════════════════════════════════════════════');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exitCode = 1;
} finally {
  // Restore original package.json
  console.log('🔄 Restoring original package.json...');
  fs.writeFileSync(pkgPath, originalPkg);
  console.log('✅ package.json restored');
}