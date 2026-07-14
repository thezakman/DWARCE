'use strict';

const { app, BrowserWindow, ipcMain, shell } = require('electron');
const fs = require('fs');
const path = require('path');
const store = require('./store');

let win = null;
let statePath = null;

/* ---------------------------------------------------------------- *
 *  IPC — delega toda a lógica de estado para ./store.js            *
 * ---------------------------------------------------------------- */

function registerIpc() {
  ipcMain.handle('rce:get', () => store.get());
  ipcMain.handle('rce:incident', (_e, note) => store.registerIncident(note));
  ipcMain.handle('rce:edit', (_e, payload) => store.edit(payload));
  ipcMain.handle('rce:clearHistory', () => store.clearHistory());
  ipcMain.handle('rce:reveal', () => {
    shell.showItemInFolder(statePath);
    return true;
  });
}

/* ---------------------------------------------------------------- *
 *  Janela                                                           *
 * ---------------------------------------------------------------- */

function createWindow() {
  win = new BrowserWindow({
    width: 940,
    height: 760,
    minWidth: 680,
    minHeight: 560,
    backgroundColor: '#111112',
    title: 'Days Without RCE',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  win.once('ready-to-show', () => win.show());

  // Screenshot de dev (gated): RCE_SHOT=/caminho.png electron .
  if (process.env.RCE_SHOT) {
    win.webContents.once('did-finish-load', async () => {
      if (process.env.RCE_LANG) {
        await win.webContents.executeJavaScript(
          `localStorage.setItem('rce.lang','${process.env.RCE_LANG}')`);
        win.webContents.reload();
      }
      if (process.env.RCE_CLICK) {
        setTimeout(() => win.webContents.executeJavaScript(
          `document.getElementById('btnIncident').click();`
          + `setTimeout(()=>document.getElementById('incidentConfirm').click(),120);`), 400);
      }
      setTimeout(async () => {
        try {
          const img = await win.webContents.capturePage();
          fs.writeFileSync(process.env.RCE_SHOT, img.toPNG());
        } catch (e) { console.error('shot error', e); }
        app.quit();
      }, 1400);
    });
  }

  // Um app sobre RCE não abre links externos dentro dele. 😏
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  statePath = path.join(app.getPath('userData'), 'rce-board.json');
  store.init(statePath);
  registerIpc();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
