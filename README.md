
```
endoscopy-system
├─ backend
│  ├─ config
│  │  ├─ cloudinary.js
│  │  └─ db.js
│  ├─ createAdmin.js
│  ├─ middleware
│  │  └─ auth.js
│  ├─ migrateImages.js
│  ├─ models
│  │  ├─ Patient.js
│  │  ├─ Report.js
│  │  ├─ Setting.js
│  │  └─ User.js
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ routes
│  │  ├─ auth.js
│  │  ├─ patients.js
│  │  ├─ reports.js
│  │  └─ settings.js
│  ├─ seedAdmin.js
│  ├─ server.js
│  └─ utils
│     └─ pdfGenerator.js
├─ frontend
│  ├─ index.html
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ postcss.config.js
│  ├─ public
│  ├─ src
│  │  ├─ App.jsx
│  │  ├─ components
│  │  │  ├─ Auth
│  │  │  │  └─ Login.jsx
│  │  │  ├─ Camera
│  │  │  │  └─ CameraTest.jsx
│  │  │  ├─ Dashboard
│  │  │  │  └─ Dashboard.jsx
│  │  │  ├─ Layout
│  │  │  │  └─ MainLayout.jsx
│  │  │  ├─ Patients
│  │  │  │  ├─ PatientDetails.jsx
│  │  │  │  └─ PatientList.jsx
│  │  │  ├─ Reports
│  │  │  │  ├─ CreateReport.jsx
│  │  │  │  ├─ EndoCamera.jsx
│  │  │  │  ├─ FindingsPanel.jsx
│  │  │  │  ├─ PentaxLiveFeed.jsx
│  │  │  │  ├─ PrintReport.jsx
│  │  │  │  └─ ReportsList.jsx
│  │  │  └─ Settings
│  │  │     └─ Settings.jsx
│  │  ├─ context
│  │  │  └─ AuthContext.jsx
│  │  ├─ hooks
│  │  │  └─ useCamera.js
│  │  ├─ index.css
│  │  ├─ main.jsx
│  │  └─ utils
│  │     ├─ api.js
│  │     ├─ AuthContext.jsx
│  │     └─ clinicalMasterData.js
│  ├─ tailwind.config.js
│  ├─ vercel.json
│  └─ vite.config.js
├─ main.js
├─ package-lock.json
└─ package.json

```