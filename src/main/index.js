import { app, BrowserWindow, Menu } from 'electron' // eslint-disable-line
const Client = require('@vpubevo/vpub-core');
const client = new Client({
  username: 'mn',
  password: '999000',
  port: 11772,
});

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\') // eslint-disable-line
}

let mainWindow;
const winURL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:9080'
  : `file://${__dirname}/index.html`;


function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 600,
    useContentSize: true,
    width: 450,
    webPreferences: {
      allowRunningInsecureContent: true,
      webSecurity: false,
    },
  });

  mainWindow.loadURL(winURL);


  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create the Application's main menu
  const template = [{
    label: 'Application',
    submenu: [
      { label: 'Open Developer Tools', click() { mainWindow.webContents.openDevTools(); } },
      { label: 'Quit', accelerator: 'Command+Q', click() { app.quit(); } },
    ],
  }, {
    label: 'Edit',
    submenu: [
      { label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:' },
      { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:' },
      { type: 'separator' },
      { label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
      { label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
      { label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
      {
        label: 'Select All',
        accelerator: 'CmdOrCtrl+A',
        selector: 'selectAll:',
      },
    ],
  }];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.on('ready', createWindow);

app.on('quit', () => {
  client
    .stop()
    .then(() => {
      setTimeout(() => {
        app.quit();
      }, 1000);
    })
    .catch(() => {
      setTimeout(() => {
        app.quit();
      }, 1000);
    });
});

app.on('window-all-closed', () => {
  // if (process.platform !== 'darwin') {
  client
    .stop()
    .then(() => {
      setTimeout(() => {
        app.quit();
      }, 1000);
    })
    .catch(() => {
      app.quit();
    });
  // }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
