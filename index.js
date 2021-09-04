const {app, BrowserWindow, ipcMain, session} = require("electron");

//checking for command line parameters
var args = process.argv;

//check for parameter
function checkParameter(name) {
    for (var x in args) {
        if (args[x] == name) {
            return true;
        }
    }

    return false;
}

function initMainWindow() {
    const win = new BrowserWindow({
        minWidth: 800,
        minHeight: 600,
        title: "Carbon",
        frame: false,
        webPreferences: {
            preload: __dirname + "/preload.js",
            webviewTag: true,
            contextIsolation: false,
            enableRemoteModule: true,
            webSecurity: false
        }
    });

    win.loadFile("app/index.html");
    win.removeMenu();

    if (checkParameter("--debug")) {
        win.webContents.openDevTools();
    }
}

app.whenReady().then(initMainWindow);

app.on("window-all-closed", app.exit);