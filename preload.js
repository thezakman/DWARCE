'use strict';

const { contextBridge, ipcRenderer } = require('electron');

// API mínima e segura exposta ao renderer.
contextBridge.exposeInMainWorld('rce', {
  get: () => ipcRenderer.invoke('rce:get'),
  setTopic: (id) => ipcRenderer.invoke('rce:setTopic', id),
  registerIncident: (note) => ipcRenderer.invoke('rce:incident', note),
  edit: (payload) => ipcRenderer.invoke('rce:edit', payload),
  clearHistory: () => ipcRenderer.invoke('rce:clearHistory'),
  addTopic: (def) => ipcRenderer.invoke('rce:addTopic', def),
  updateTopic: (id, def) => ipcRenderer.invoke('rce:updateTopic', id, def),
  deleteTopic: (id) => ipcRenderer.invoke('rce:deleteTopic', id),
  reveal: () => ipcRenderer.invoke('rce:reveal'),
});
