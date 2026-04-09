// /**
//  * ══════════════════════════════════════════════════════════════
//  * 🏗️ BUILD SCRIPT: Windows 7 (32-bit) Installer
//  * Uses Electron v22.3.27 (last version supporting Win7)
//  * ══════════════════════════════════════════════════════════════
//  */

// const { execSync } = require('child_process');
// const fs = require('fs');
// const path = require('path');

// console.log('═══════════════════════════════════════════════════');
// console.log('🏗️  Building EndoSystem for Windows 7 (32-bit)');
// console.log('    Using Electron v22.3.27');
// console.log('═══════════════════════════════════════════════════');

// // Step 1: Save current package.json
// const pkgPath = path.join(__dirname, 'package.json');
// const originalPkg = fs.readFileSync(pkgPath, 'utf8');
// const pkg = JSON.parse(originalPkg);

// // Step 2: Temporarily change Electron version to v22
// const originalElectron = pkg.devDependencies.electron;
// const originalBuilder = pkg.devDependencies['electron-builder'];

// pkg.devDependencies.electron = '22.3.27';
// pkg.devDependencies['electron-builder'] = '24.13.3';

// // Force 32-bit only for this build
// pkg.build.win.target = [
//   {
//     target: 'nsis',
//     arch: ['ia32']
//   }
// ];

// // Change artifact name to clearly label it
// pkg.build.nsis.artifactName = 'EndoSystem-Setup-${version}-Win7-32bit.${ext}';

// fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
// console.log('✅ package.json updated for Win7 build');

// try {
//   // Step 3: Remove current node_modules electron
//   console.log('📦 Removing current Electron...');
//   try {
//     execSync('npm uninstall electron electron-builder', { stdio: 'inherit' });
//   } catch (e) {
//     // Ignore errors if not installed
//   }

//   // Step 4: Install Electron v22
//   console.log('📦 Installing Electron v22.3.27...');
//   execSync('npm install electron@22.3.27 --save-dev --force', { stdio: 'inherit' });
//   execSync('npm install electron-builder@24.13.3 --save-dev --force', { stdio: 'inherit' });

//   // Step 5: Verify version
//   const version = execSync('npx electron --version').toString().trim();
//   console.log(`✅ Electron version: ${version}`);

//   if (!version.startsWith('v22')) {
//     throw new Error(`Expected v22.x but got ${version}`);
//   }

//   // Step 6: Build frontend
//   console.log('🔨 Building frontend...');
//   execSync('cd frontend && npm run build', { stdio: 'inherit' });

//   // Step 7: Build Win7 32-bit installer
//   console.log('🔨 Building Win7 32-bit installer...');
//   execSync('npx electron-builder --win --ia32', { stdio: 'inherit' });

//   console.log('═══════════════════════════════════════════════════');
//   console.log('✅ Win7 32-bit build COMPLETE!');
//   console.log('   Output: release/EndoSystem-Setup-1.0.0-Win7-32bit.exe');
//   console.log('═══════════════════════════════════════════════════');

// } catch (error) {
//   console.error('❌ Build failed:', error.message);
// } finally {
//   // Step 8: ALWAYS restore original package.json
//   console.log('🔄 Restoring original package.json...');
//   fs.writeFileSync(pkgPath, originalPkg);
//   console.log('✅ package.json restored');

//   // Step 9: Reinstall original Electron version
//   console.log('📦 Reinstalling Electron v41...');
//   try {
//     execSync('npm uninstall electron electron-builder', { stdio: 'inherit' });
//     execSync(`npm install electron@${originalElectron.replace('^', '')} --save-dev --force`, { stdio: 'inherit' });
//     execSync(`npm install electron-builder@${originalBuilder.replace('^', '')} --save-dev --force`, { stdio: 'inherit' });
//     console.log('✅ Original Electron restored');
//   } catch (e) {
//     console.error('⚠️ Failed to restore original Electron. Run: npm install');
//   }
// }


/**
 * ══════════════════════════════════════════════════════════════
 * 🏗️ BUILD SCRIPT: Windows 7 (32-bit) Installer
 * Uses Electron v22.3.27 (last version supporting Win7)
 * ══════════════════════════════════════════════════════════════
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('═══════════════════════════════════════════════════');
console.log('🏗️  Building EndoSystem for Windows 7 (32-bit)');
console.log('    Using Electron v22.3.27');
console.log('═══════════════════════════════════════════════════');

// Step 1: Save current package.json
const pkgPath = path.join(__dirname, 'package.json');
const originalPkg = fs.readFileSync(pkgPath, 'utf8');
const pkg = JSON.parse(originalPkg);

// Step 2: Temporarily change Electron version to v22
const originalElectron = pkg.devDependencies.electron;
const originalBuilder = pkg.devDependencies['electron-builder'];

pkg.devDependencies.electron = '22.3.27';
pkg.devDependencies['electron-builder'] = '24.13.3';

// Force 32-bit only for this build
pkg.build.win.target = [
  {
    target: 'nsis',
    arch: ['ia32']
  }
];

// Change artifact name to clearly label it
pkg.build.nsis.artifactName = 'EndoSystem-Setup-${version}-Win7-32bit.${ext}';

// ═══════════════════════════════════════════════════════════════
// 🔥 CRITICAL: Exclude 64-bit Puppeteer/Chromium from bundle
// This prevents crashes on 32-bit Windows 7
// ═══════════════════════════════════════════════════════════════
pkg.build.files = [
  "main.js",
  "preload.js",
  "package.json",
  "assets/**/*",
  "license/**/*",
  "backend/**/*",
  "frontend/dist/**/*",
  
  // ❌ EXCLUDE: These cause 32-bit crashes
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
  "!developer-tools/**/*",
  
  // ❌ EXCLUDE: Large unnecessary files
  "!**/node_modules/electron/**",
  "!**/node_modules/electron-builder/**",
  "!**/node_modules/@electron/**"
];

// Also update asarUnpack to exclude Puppeteer
pkg.build.asarUnpack = [
  "backend/**/*",
  "frontend/dist/**/*",
  "!**/puppeteer/**",
  "!**/.local-chromium/**",
  "!**/html-pdf-node/**"
];

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
console.log('✅ package.json updated for Win7 build');

// ═══════════════════════════════════════════════════════════════
// 🧹 PRE-BUILD CLEANUP: Remove Puppeteer from backend if exists
// ═══════════════════════════════════════════════════════════════
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
        console.warn(`   ⚠️ Could not remove ${p}: ${e.message}`);
      }
    }
  });
};

try {
  // Step 3: Clean up Puppeteer/html-pdf-node BEFORE build
  console.log('🧹 Cleaning up 64-bit dependencies...');
  cleanupPuppeteer();
  
  // Step 4: Remove current node_modules electron
  console.log('📦 Removing current Electron...');
  try {
    execSync('npm uninstall electron electron-builder', { stdio: 'inherit' });
  } catch (e) {
    // Ignore errors if not installed
  }

  // Step 5: Install Electron v22
  console.log('📦 Installing Electron v22.3.27...');
  execSync('npm install electron@22.3.27 --save-dev --force', { stdio: 'inherit' });
  execSync('npm install electron-builder@24.13.3 --save-dev --force', { stdio: 'inherit' });

  // Step 6: Verify version
  const version = execSync('npx electron --version').toString().trim();
  console.log(`✅ Electron version: ${version}`);

  if (!version.startsWith('v22')) {
    throw new Error(`Expected v22.x but got ${version}`);
  }

  // Step 7: Clean backend node_modules of problematic packages
  console.log('🧹 Final cleanup of backend dependencies...');
  try {
    const backendPath = path.join(__dirname, 'backend');
    if (fs.existsSync(path.join(backendPath, 'package.json'))) {
      // Uninstall html-pdf-node if it exists
      execSync('npm uninstall html-pdf-node puppeteer --save 2>nul || true', { 
        cwd: backendPath, 
        stdio: 'pipe',
        shell: true 
      });
    }
  } catch (e) {
    // Ignore - package may not exist
  }
  cleanupPuppeteer(); // Run again after npm operations

  // Step 8: Build frontend
  console.log('🔨 Building frontend...');
  execSync('cd frontend && npm run build', { stdio: 'inherit' });

  // Step 9: Build Win7 32-bit installer
  console.log('🔨 Building Win7 32-bit installer...');
  execSync('npx electron-builder --win --ia32', { stdio: 'inherit' });

  // Step 10: Verify output size (should be ~150MB, not ~400MB)
  const outputPath = path.join(__dirname, 'release', 'EndoSystem-Setup-1.0.0-Win7-32bit.exe');
  if (fs.existsSync(outputPath)) {
    const stats = fs.statSync(outputPath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);
    console.log(`📊 Installer size: ${sizeMB} MB`);
    
    if (stats.size > 300 * 1024 * 1024) {
      console.warn('⚠️  WARNING: Installer is larger than expected!');
      console.warn('   Puppeteer/Chromium may still be bundled.');
      console.warn('   Check backend/node_modules for puppeteer folders.');
    } else {
      console.log('✅ Size looks good - no Puppeteer bloat detected');
    }
  }

  console.log('═══════════════════════════════════════════════════');
  console.log('✅ Win7 32-bit build COMPLETE!');
  console.log('   Output: release/EndoSystem-Setup-1.0.0-Win7-32bit.exe');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('📋 WHAT TO TEST ON WIN7 32-BIT:');
  console.log('   1. App launches without crash');
  console.log('   2. MongoDB connects (must be pre-installed)');
  console.log('   3. Create/view reports works');
  console.log('   4. Print button works');
  console.log('   5. PDF download works (uses Electron, not Puppeteer)');
  console.log('');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exitCode = 1;
} finally {
  // Step 11: ALWAYS restore original package.json
  console.log('🔄 Restoring original package.json...');
  fs.writeFileSync(pkgPath, originalPkg);
  console.log('✅ package.json restored');

  // Step 12: Reinstall original Electron version
  console.log('📦 Reinstalling Electron v41...');
  try {
    execSync('npm uninstall electron electron-builder', { stdio: 'pipe' });
    execSync(`npm install electron@${originalElectron.replace('^', '')} --save-dev --force`, { stdio: 'inherit' });
    execSync(`npm install electron-builder@${originalBuilder.replace('^', '')} --save-dev --force`, { stdio: 'inherit' });
    console.log('✅ Original Electron restored');
  } catch (e) {
    console.error('⚠️ Failed to restore original Electron. Run: npm install');
  }
}