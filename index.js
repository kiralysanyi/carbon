const { app, BrowserWindow, ipcMain, session, BrowserView, MenuItem, Menu, ipcRenderer } = require("electron");
//checking for command line parameters
var args = process.argv;

var mainWin = null;
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

    mainWin = win;

    win.loadFile("app/index.html");
    win.removeMenu();

    ipcMain.on("minimize", (e) => {
        win.minimize();
        e.returnValue = 0;
    })

    ipcMain.on("closewin", (e) => {
        win.close();
    })

    ipcMain.on("maximize", (e) => {
        if (win.isMaximized()) {
            win.unmaximize();
        }
        else {
            win.maximize();
        }
        e.returnValue = 0;
    })

    if (checkParameter("--debug")) {
        win.webContents.openDevTools();
    }
    var views = win.getBrowserViews();

    ipcMain.on("addListeners", (e) => {
        views = win.getBrowserViews();
        for (var x in views) {
            views[x].webContents.addListener("new-window", (e, url) => {
                e.preventDefault();
            })
        }


        e.returnValue = 0;
    })

    //tab management
    var webviews = {};

    ipcMain.on("newTab", (e, data) => {
        const view = new BrowserView();
        win.setBrowserView(view);
        view.setBounds({width: win.getBounds().width, height: win.getBounds().height - 90, x: 0, y: 90});
        view.setAutoResize({width: true, height: true});
        webviews[data.uuid] = view;
        const uuid = data.uuid;
        e.returnValue = 0;

        function sendEvent(data) {
            console.log("Sending data to renderer: ", data);
            win.webContents.postMessage(uuid, data);
        }

        view.webContents.on("did-start-loading", () => {
            sendEvent({type: "did-start-loading"})
        });
        view.webContents.on("did-stop-loading", () => {
            sendEvent({type: "did-stop-loading"})
        });

        view.webContents.on("page-title-updated", () => {
            sendEvent({type: "page-title-updated", title: view.webContents.getTitle()});
        });

        view.webContents.on("page-favicon-updated", (e, favicons) => {
            sendEvent({type: "page-favicon-updated", favicons: favicons});
        });

        view.webContents.on("new-window", (e, url) => {
            sendEvent({type: "new-window", url: url});
        });
        var isFullScreen = false;

        view.webContents.on("enter-html-full-screen", () => {
            isFullScreen = true;
        })

        view.webContents.on("leave-html-full-screen", () => {
            isFullScreen = false;
        })

        setInterval(() => {
            var y = 0;
            if (isFullScreen == true) {
                y = 0;
            }
            else {
                y = 90;
            }
            view.setBounds({width: win.getBounds().width, height: win.getBounds().height, x: 0, y: y});
        }, 500);
    });

    ipcMain.on("removeTab", (e, uuid) => {
        const view = webviews[uuid];
        view.webContents.destroy();
        delete webviews[uuid];
        e.returnValue = 0;
    })

    ipcMain.on("openDevTools", (e, uuid) => {
        const view = webviews[uuid];
        view.webContents.openDevTools();
        e.returnValue = 0;
    })

    ipcMain.on("navigate", (e, data) => {
        const view = webviews[data.uuid];
        view.webContents.loadURL(data.url);
        e.returnValue = 0;
    })

    ipcMain.on("reload", (e, uuid) => {
        const view = webviews[uuid];
        view.webContents.reload();
        e.returnValue = 0;
    })

    ipcMain.on("goBack", (e, uuid) => {
        const view = webviews[uuid];
        view.webContents.goBack();
        e.returnValue = 0;
    })

    ipcMain.on("goForward", (e, uuid) => {
        const view = webviews[uuid];
        view.webContents.goForward();
        e.returnValue = 0;
    })

    ipcMain.on("canGoBack", (e, uuid) => {
        const view = webviews[uuid];
        e.returnValue = view.webContents.canGoBack();
    })

    ipcMain.on("canGoForward", (e, uuid) => {
        const view = webviews[uuid];
        e.returnValue = view.webContents.canGoForward();
    })

    ipcMain.on("getUrl", (e, uuid) => {
        const view = webviews[uuid];
        console.log(view.webContents.getURL());
        e.returnValue = view.webContents.getURL();
    })

    ipcMain.on("focusTab", (e, uuid) => {
        const view = webviews[uuid];
        win.setBrowserView(view);
        win.setTopBrowserView(view);
        e.returnValue = 0;
    })

    ipcMain.on("hideTab", (e, uuid) => {
        const view = webviews[uuid];
        win.removeBrowserView(view);
        e.returnValue = 0;
    })
}

const menu = new Menu();
const menuitems = {
    reload: new MenuItem({
        label: "Reload",
        click: () => {
            console.log("Reload")
            mainWin.webContents.postMessage("command", "reload");
        }
    }),
    devtools: new MenuItem({
        label: "DevTools",
        click: () => {
            console.log("Devtools")
            mainWin.webContents.postMessage("command", "devtools");
        }
    })

}

menu.append(menuitems.reload);
menu.append(menuitems.devtools);

function openMenu() {
    menu.popup({ x: 100, y: 50 });
}

ipcMain.on("openMenu", openMenu);

app.whenReady().then(initMainWindow);

app.on("window-all-closed", app.exit);