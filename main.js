const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

let mainWindow;
let resizeInterval;
const dataPath = path.join(app.getPath('userData'), 'notes_data.json');

const singleInstanceLock = app.requestSingleInstanceLock();

if (!singleInstanceLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine) => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();

            const filePath = commandLine.pop();
            if (filePath && filePath.endsWith('.txt')) {
                processExternalFile(filePath);
            }
        }
    });

    app.whenReady().then(createWindow);
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 650,
        frame: false,
        transparent: true,
        icon: path.join(__dirname, 'icon.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            devTools: false
        }
    });

    mainWindow.loadFile('index.html');

    mainWindow.webContents.on('did-finish-load', () => {
        const filePath = process.argv.find(arg => arg.endsWith('.txt'));
        if (filePath) {
            processExternalFile(filePath);
        }
    });

    ipcMain.on('window-close', () => mainWindow.close());
    ipcMain.on('window-minimize', () => mainWindow.minimize());
    
    ipcMain.on('window-pin', (event) => {
        const isPinned = mainWindow.isAlwaysOnTop();
        mainWindow.setAlwaysOnTop(!isPinned);
        event.reply('pin-status', !isPinned);
    });

    ipcMain.on('settings-mode', (event, isActive) => {
        const targetWidth = isActive ? 550 : 900;
        animateWindowWidth(mainWindow, targetWidth, 350);
    });

    ipcMain.handle('get-stored-notes', () => {
        if (fs.existsSync(dataPath)) {
            return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
        }
        return [];
    });

    ipcMain.handle('save-stored-notes', (event, notes) => {
        fs.writeFileSync(dataPath, JSON.stringify(notes), 'utf-8');
        return true;
    });

    ipcMain.handle('file-save', async (event, title, content) => {
        const { filePath } = await dialog.showSaveDialog(mainWindow, {
            title: 'Export Note',
            defaultPath: `${title || 'Note'}.txt`,
            filters: [{ name: 'Text Files', extensions: ['txt'] }]
        });
        
        if (filePath) {
            fs.writeFileSync(filePath, content, 'utf-8');
            return true;
        }
        return false;
    });

    ipcMain.handle('file-open', async () => {
        const { filePaths } = await dialog.showOpenDialog(mainWindow, {
            title: 'Open Note',
            filters: [{ name: 'Text Files', extensions: ['txt'] }],
            properties: ['openFile']
        });
        
        if (filePaths && filePaths.length > 0) {
            return readTextData(filePaths[0]);
        }
        return null;
    });

    autoUpdater.checkForUpdatesAndNotify();
}

function readTextData(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const title = path.basename(filePath, '.txt');
        return { title, content };
    } catch (error) {
        return null;
    }
}

function processExternalFile(filePath) {
    const fileData = readTextData(filePath);
    if (fileData) {
        mainWindow.webContents.send('external-file-open', fileData);
    }
}

function animateWindowWidth(win, targetWidth, duration) {
    if (resizeInterval) clearInterval(resizeInterval);

    const startBounds = win.getBounds();
    const startWidth = startBounds.width;
    const distance = targetWidth - startWidth;
    const startTime = Date.now();
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);

    resizeInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        let progress = elapsed / duration;

        if (progress >= 1) {
            progress = 1;
            clearInterval(resizeInterval);
        }

        const currentWidth = Math.round(startWidth + (distance * easeOut(progress)));
        win.setBounds({
            x: startBounds.x,
            y: startBounds.y,
            width: currentWidth,
            height: startBounds.height
        });
    }, 16);
}

autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('update-available', {
        currentVersion: app.getVersion(),
        latestVersion: info.version
    });
});

autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update-ready');
});

ipcMain.on('install-update', () => autoUpdater.quitAndInstall());

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});