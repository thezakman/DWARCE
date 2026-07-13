'use strict';

const { contextBridge, ipcRenderer } = require('electron');

// API mínima e segura exposta ao renderer.
contextBridge.exposeInMainWorld('rce', {
  get: () => ipcRenderer.invoke('rce:get'),
  registerIncident: (note) => ipcRenderer.invoke('rce:incident', note),
  edit: (payload) => ipcRenderer.invoke('rce:edit', payload),
  clearHistory: () => ipcRenderer.invoke('rce:clearHistory'),
  reveal: () => ipcRenderer.invoke('rce:reveal'),
});
