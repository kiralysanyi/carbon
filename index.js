const { app, BrowserWindow, ipcMain, session, BrowserView } = require("electron");
require('@electron/remote/main').initialize();
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
            webSecurity: false,
            nodeIntegration: true,
        }
    });

    win.loadFile("app/index.html");
    win.removeMenu();

    require("@electron/remote/main").enable(win.webContents)

    if (checkParameter("--debug")) {
        win.webContents.openDevTools();
    }
    var views = win.getBrowserViews();

    ipcMain.on("addListeners", (e) => {
        views = win.getBrowserViews();
        for(var x in views) {
            views[x].webContents.addListener("new-window", (e, url) => {
                e.preventDefault();
            })
        }


        e.returnValue = 0;
    })
}

app.whenReady().then(initMainWindow);

app.on("window-all-closed", app.exit);