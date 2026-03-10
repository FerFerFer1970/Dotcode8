const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  chooseFolder: () => ipcRenderer.invoke('choose-folder'),
  chooseImage: () => ipcRenderer.invoke('choose-image'),
  chooseFont: () => ipcRenderer.invoke('choose-font'),

  render: (opts) => ipcRenderer.invoke('render', opts),
  saveSvgs: (opts) => ipcRenderer.invoke('save-svgs', opts),
  saveSequence: (opts) => ipcRenderer.invoke('save-sequence', opts),

  loadSettings: () => ipcRenderer.invoke('load-settings'),
  saveSettings: (opts) => ipcRenderer.invoke('save-settings', opts),
});