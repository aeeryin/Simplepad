const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

autoUpdater.logger = require('electron-log');
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.provider = 'github';

let mainWindow;
let resizeInterval;
const dataPath = path.join(app.getPath('userData'), 'notes_data.json');

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine) => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();

            const filePath = commandLine.find(arg => arg.endsWith('.txt'));
            if (filePath) {
                openExternalFile(filePath);
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
            openExternalFile(filePath);
        }
    });

    ipcMain.handle('get-stored-notes', () => {
        if (fs.existsSync(dataPath)) {
            return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
        }
        return [];
    });

    ipcMain.handle('get-app-version', () => {
        return app.getVersion();
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
            return readTextFile(filePaths[0]);
        }
        return null;
    });

    ipcMain.handle('export-pdf', async (event, title) => {
        const { filePath } = await dialog.showSaveDialog(mainWindow, {
            title: 'Export as PDF',
            defaultPath: `${title || 'Note'}.pdf`,
            filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
        });

        if (filePath) {
            const options = {
                marginsType: 0,
                pageSize: 'A4',
                printBackground: true,
                printSelectionOnly: false,
                landscape: false
            };
            try {
                const data = await mainWindow.webContents.printToPDF(options);
                fs.writeFileSync(filePath, data);
                return true;
            } catch (error) {
                return false;
            }
        }
        return false;
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
        animateWindow(mainWindow, targetWidth, 350);
    });

    autoUpdater.checkForUpdatesAndNotify();
}

function readTextFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const title = path.basename(filePath, '.txt');
    return { title, content };
}

function openExternalFile(filePath) {
    const fileData = readTextFile(filePath);
    if (mainWindow) {
        mainWindow.webContents.send('external-file-open', fileData);
    }
}

function animateWindow(win, targetWidth, duration) {
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

autoUpdater.on('error', (err) => {
    console.error('AutoUpdater Error:', err);
});

ipcMain.on('install-update', () => {
    autoUpdater.quitAndInstall();
});

ipcMain.on('start-download', () => {
    autoUpdater.downloadUpdate();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});