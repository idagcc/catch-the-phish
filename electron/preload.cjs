const { ipcRenderer } = require('electron');

// Expose only a DOM notification; the renderer receives no Electron or Node APIs.
ipcRenderer.on('ctphish:rotate', () => {
  window.dispatchEvent(new Event('ctphish:rotate'));
});
