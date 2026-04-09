const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  print: () => ipcRenderer.invoke('print-page'),
  printPage: () => ipcRenderer.invoke('print-page'),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  downloadPdf: (data) => ipcRenderer.invoke('download-pdf', data),
  isElectron: true
});