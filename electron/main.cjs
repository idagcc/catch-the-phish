const { app, BrowserWindow, dialog, Menu, powerSaveBlocker, protocol, screen } = require('electron');
const path = require('node:path');
const { createAssetHandler } = require('./asset-protocol.cjs');

app.setName('Catch the Phish');
app.setPath('userData', path.join(app.getPath('appData'), 'Catch the Phish'));
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
protocol.registerSchemesAsPrivileged([
  { scheme: 'ctphish', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } },
]);

let mainWindow;
let allowQuit = false;
let exitDialogOpen = false;
let displayId;
let sleepBlocker;
const windowed = process.argv.includes('--windowed');
let presentationMode = !windowed;

const hasLock = app.requestSingleInstanceLock();
if (!hasLock) app.quit();

function chooseDisplay() {
  const displays = screen.getAllDisplays();
  const portraitDisplays = displays
    .filter(({ bounds }) => bounds.height > bounds.width)
    .sort((a, b) => b.bounds.width * b.bounds.height - a.bounds.width * a.bounds.height);
  return portraitDisplays[0] || screen.getPrimaryDisplay();
}

function fitDisplay() {
  if (!mainWindow || mainWindow.isDestroyed() || !presentationMode) return;
  const display = chooseDisplay();
  displayId = display.id;
  mainWindow.setKiosk(false);
  mainWindow.setFullScreen(false);
  mainWindow.setBounds(display.bounds);
  mainWindow.setKiosk(true);
}

async function requestExit() {
  if (!mainWindow || mainWindow.isDestroyed() || exitDialogOpen) return;
  exitDialogOpen = true;
  try {
    const { response } = await dialog.showMessageBox(mainWindow, {
      type: 'question',
      title: 'Close Catch the Phish?',
      message: 'Close the game and return to Windows?',
      detail: 'Saved leaderboard scores will be kept on this computer.',
      buttons: ['Keep playing', 'Close game'],
      defaultId: 0,
      cancelId: 0,
      noLink: true,
    });
    if (response === 1) {
      allowQuit = true;
      app.quit();
    }
  } finally {
    exitDialogOpen = false;
  }
}

function createWindow() {
  const display = chooseDisplay();
  displayId = display.id;
  const bounds = windowed
    ? { x: display.workArea.x + 20, y: display.workArea.y + 20, width: 540, height: 960 }
    : display.bounds;

  mainWindow = new BrowserWindow({
    ...bounds,
    title: 'Catch the Phish',
    backgroundColor: '#03122b',
    show: false,
    kiosk: !windowed,
    fullscreen: !windowed,
    frame: windowed,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      devTools: !app.isPackaged,
      spellcheck: false,
      backgroundThrottling: false,
    },
  });

  Menu.setApplicationMenu(null);
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event) => event.preventDefault());
  mainWindow.webContents.on('will-attach-webview', (event) => event.preventDefault());
  mainWindow.webContents.session.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  mainWindow.webContents.session.setPermissionCheckHandler(() => false);
  mainWindow.webContents.once('did-finish-load', () => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.setVisualZoomLevelLimits(1, 1).catch((error) => {
        console.warn('Could not lock visual zoom:', error.message);
      });
    }
  });

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;
    if ((input.control || input.meta) && input.shift && input.key.toLowerCase() === 'q') {
      event.preventDefault();
      void requestExit();
      return;
    }
    if (input.key === 'F11') {
      event.preventDefault();
      if (mainWindow.isKiosk()) {
        presentationMode = false;
        mainWindow.setKiosk(false);
        mainWindow.setFullScreen(false);
        const currentDisplay = screen.getDisplayMatching(mainWindow.getBounds());
        mainWindow.setBounds({ ...currentDisplay.workArea, width: Math.min(540, currentDisplay.workArea.width), height: Math.min(960, currentDisplay.workArea.height) });
      } else {
        presentationMode = true;
        fitDisplay();
      }
    }
    if ((input.control || input.meta) && ['+', '-', '=', '0'].includes(input.key)) event.preventDefault();
  });

  mainWindow.on('close', (event) => {
    if (!allowQuit) {
      event.preventDefault();
      void requestExit();
    }
  });
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });
  mainWindow.webContents.on('render-process-gone', () => {
    if (!allowQuit && mainWindow && !mainWindow.isDestroyed()) mainWindow.reload();
  });
  mainWindow.loadURL('ctphish://app/index.html').catch((error) => {
    dialog.showErrorBox('Catch the Phish could not start', `The game files could not be opened. Extract the complete Windows ZIP and try again.\n\n${error.message}`);
    allowQuit = true;
    app.quit();
  });
}

if (hasLock) {
  app.whenReady().then(() => {
    const distRoot = path.resolve(__dirname, '..', 'dist');
    protocol.handle('ctphish', createAssetHandler(distRoot));
    sleepBlocker = powerSaveBlocker.start('prevent-display-sleep');
    createWindow();
    screen.on('display-added', fitDisplay);
    screen.on('display-removed', (_event, display) => {
      if (display.id === displayId) fitDisplay();
    });
    screen.on('display-metrics-changed', (_event, display) => {
      if (display.id === displayId) fitDisplay();
    });
  });
  app.on('second-instance', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
  app.on('before-quit', () => { allowQuit = true; });
  app.on('window-all-closed', () => app.quit());
  app.on('will-quit', () => {
    if (sleepBlocker !== undefined && powerSaveBlocker.isStarted(sleepBlocker)) powerSaveBlocker.stop(sleepBlocker);
  });
}
