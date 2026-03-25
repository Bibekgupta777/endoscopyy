// // // import { defineConfig } from 'vite';
// // // import react from '@vitejs/plugin-react';

// // // export default defineConfig({
// // //   root: './',
// // //   plugins: [react()],
// // //   base: './',  // ← CHANGE THIS FROM '/' TO './'
// // //   build: {
// // //     outDir: 'dist',
// // //   },
// // //   server: {
// // //     port: 3000,
// // //     strictPort: true,
// // //     proxy: {
// // //       '/api': {
// // //         target: 'http://localhost:5000',
// // //         changeOrigin: true,
// // //       },
// // //     },
// // //   },
// // // });


// // import { defineConfig } from 'vite';
// // import react from '@vitejs/plugin-react';

// // export default defineConfig({
// //   root: './',
// //   plugins: [react()],
// //   base: '/',
// //   build: {
// //     outDir: 'dist',
// //   },
// //   server: {
// //     port: 3000,
// //     strictPort: true,
// //     proxy: {
// //       '/api': {
// //         target: 'http://localhost:5000',
// //         changeOrigin: true,
// //       },
// //     },
// //   },
// // });

// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';

// export default defineConfig({
//   root: './',
//   plugins: [react()],
//   // ✅ CRITICAL FOR ELECTRON: Must be relative path './' not '/'
//   base: './', 
//   build: {
//     outDir: 'dist',
//   },
//   server: {
//     port: 3000,
//     strictPort: true,
//     proxy: {
//       '/api': {
//         target: 'http://localhost:5000',
//         changeOrigin: true,
//       },
//     },
//   },
// });

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: './',
  plugins: [react()],
  // ✅ CRITICAL FOR EXPRESS: Must be absolute path '/' so nested routes load correctly
  base: '/', 
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});