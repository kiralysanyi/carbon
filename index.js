const { app, BrowserWindow, ipcMain, session, BrowserView, MenuItem, Menu, ipcRenderer, webContents } = require("electron");
const contextMenu = require('electron-context-menu');
const settings = require("./settings");
const path = require("path");
//useragent
const USERAGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36";
const USERAGENT_FIREFOX = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:70.0) Gecko/20100101 Firefox/70.0";

//checking for command line parameters
var args = process.argv;

//importing prompt module
var prompt = require("./prompt");

//permission handling, loading saved permissions and writing permissions
var permissions = {};

function loadPermissions() {
    return new Promise((resolved) => {
        var data = settings.readData("permissions.conf.json")
        if (data == false) {
            console.log("No permission config file found");
            resolved(false);
        }
        else {
            permissions = JSON.parse(data);
            console.log("Loaded permission config");
            resolved(true);
        }
    })
}

loadPermissions();


function savePermissions() {
    settings.saveData("permissions.conf.json", JSON.stringify(permissions));
}

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

function attachControlHost(win) {
    win.webContents.on("ipc-message-sync", (e, channel) => {
        if (channel == "minimize") {
            win.minimize();
            e.returnValue = 0;
        }

        if (channel == "closewin") {
            win.close();
        }

        if (channel == "maximize") {
            if (win.isMaximized()) {
                win.unmaximize();
            }
            else {
                win.maximize();
            }
            e.returnValue = 0;
        }
    })
}

function initMainWindow() {
    const win = new BrowserWindow({
        minWidth: 800,
        minHeight: 600,
        title: "Carbon",
        frame: false,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            spellcheck: false,
            contextIsolation: false,
            nodeIntegration: true,
        }
    });

    mainWin = win;

    win.loadFile("app/index.html");
    win.removeMenu();

    attachControlHost(win);

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
        const view = new BrowserView({
            webPreferences: {
                preload: path.join(app.getAppPath(), 'view_preload.js'),
                contextIsolation: false
            }
        });
        view.webContents.setUserAgent(USERAGENT);
        win.setBrowserView(view);
        view.setBounds({ width: win.getBounds().width, height: win.getBounds().height - 90, x: 0, y: 90 });
        view.setAutoResize({ width: true, height: true });
        webviews[data.uuid] = view;
        const uuid = data.uuid;
        e.returnValue = 0;

        contextMenu({
            prepend: (defaultActions, parameters, browserview) => [
                {
                    label: 'Search Google for “{selection}”',
                    // Only show it when right-clicking text
                    visible: parameters.selectionText.trim().length > 0,
                    click: () => {
                        win.webContents.postMessage("new_tab", `https://google.com/search?q=${encodeURIComponent(parameters.selectionText)}`);
                    }
                }
            ],
            window: view,
            showSearchWithGoogle: false,
            showInspectElement: false
        });


        function sendEvent(data) {
            console.log("Sending data to renderer: ", data);
            win.webContents.postMessage(uuid, data);
        }

        view.webContents.on("did-start-loading", () => {
            sendEvent({ type: "did-start-loading" })
        });
        view.webContents.on("did-stop-loading", () => {
            sendEvent({ type: "did-stop-loading" })
        });

        view.webContents.on("page-title-updated", () => {
            sendEvent({ type: "page-title-updated", title: view.webContents.getTitle() });
        });

        view.webContents.on("page-favicon-updated", (e, favicons) => {
            sendEvent({ type: "page-favicon-updated", favicons: favicons });
        });

        view.webContents.on("new-window", (e, url) => {
            sendEvent({ type: "new-window", url: url });
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
            view.setBounds({ width: win.getBounds().width, height: win.getBounds().height, x: 0, y: y });
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
    }),

    logintogoogle: new MenuItem({
        label: "Login to google",
        click: () => {
            console.log("Starting google login process");
            const win = new BrowserWindow({
                width: 800,
                height: 600
            })

            win.webContents.setUserAgent(USERAGENT_FIREFOX);

            win.webContents.on("did-navigate", (e, url) => {
                if (url.includes("myaccount.google.com")) {
                    win.close();
                    console.log("Google login process ended")
                }
            })

            win.loadURL("https://accounts.google.com");
        }
    }),
    opensettings: new MenuItem({
        label: "Settings",
        click: () => {
            const win = new BrowserWindow({
                minWidth: 800,
                minHeight: 600,
                frame: false,
                webPreferences: {
                    nodeIntegration: true,
                    preload: path.join(__dirname, "preload.js"),
                    contextIsolation: false
                }
            })

            win.loadFile("settings-gui/index.html");
            attachControlHost(win);

            if (checkParameter("--debug")) {
                win.webContents.openDevTools();
            }

            win.webContents.on("ipc-message-sync", (e, channel) => {

            })
        }
    })

}

for (var x in menuitems) {
    menu.append(menuitems[x]);
}

function openMenu() {
    menu.popup({ x: 100, y: 50 });
}

ipcMain.on("openMenu", openMenu);

app.whenReady().then(initMainWindow);

app.on("window-all-closed", app.exit);

app.on('session-created', function () {
    //permission handling
    session.defaultSession.setPermissionRequestHandler(async (webcontents, permission, callback) => {
        await loadPermissions();
        const host = new URL(webcontents.getURL()).hostname;

        console.log(host + " wants permission for: " + permission);

        if (permissions[host] && permissions[host][permission]) {
            callback(permissions[host][permission]);
            console.log("Access granted automatically:", permission);
            return permissions[host][permission];
        }
        else {
            if (permissions[host] && permissions[host][permission] == false) {
                callback(permissions[host][permission]);
                console.log("Access denied automatically", permission);
                return permissions[host][permission];
            }
        }

        if (permissions[host] && permissions[host][permission]) {
            callback(permissions[host][permission]);
            return permissions[host][permission];
        }

        if (permission == "fullscreen") {
            callback(true);
            return true;
        }

        if (permission == "background-sync") {
            callback(true);
            return true;
        }

        if (permission == "window-placement") {
            callback(true);
            return true;
        }

        if (permission == "notifications") {
            console.log("NOTE: push notifications not supported");
            callback(false);
            return false;
        }

        if (permission == "media") {
            var answer = await prompt.confirm("Do you want to grant audio/video permission for " + host + " ?");
            if (permissions[host]) {
                permissions[host][permission] = answer;
            }
            else {
                permissions[host] = {};
                permissions[host][permission] = answer;
            }
            savePermissions();
            callback(answer);
            return answer;
        }

        console.log(host, " asked for permission: ", permission)
        var answer = await prompt.confirm("Do you want to grant permission: " + permission + " for " + host + " ?");
        if (permissions[host]) {
            permissions[host][permission] = answer;
        }
        else {
            permissions[host] = {};
            permissions[host][permission] = answer;
        }
        savePermissions();
        return answer;

    });

    session.defaultSession.setPermissionCheckHandler(async (webcontents, permission, origin, details) => {
        await loadPermissions();
        const host = new URL(origin).hostname;
        if (permission == "media") {
            if (permissions[host]["media"]) {
                return true;
            }
            else {
                return false;
            }

        }
    });

});