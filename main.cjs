const { app, BrowserWindow } = require('electron');
const path = require('path');

const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Se estiver em desenvolvimento, carrega o servidor do Vite
  if (isDev) {
    win.loadURL('http://localhost:3000');
    // Opcional: abre o painel de desenvolvedor automaticamente
    // win.webContents.openDevTools()
  } else {
    // Se for o executável final, carrega a build gerada pelo Vite na pasta dist
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
