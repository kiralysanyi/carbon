const { app, BrowserWindow, ipcMain, session, BrowserView, MenuItem, Menu, webContents } = require("electron");
app.commandLine.appendSwitch("enable-transparent-visuals");
const contextMenu = require('electron-context-menu');
const settings = require("./settings");
const path = require("path");
const { ElectronBlocker } = require("@cliqz/adblocker-electron")
const glasstron = require("glasstron");

require("electron").app.commandLine.appendSwitch("enable-transparent-visuals");

//useragent
const USERAGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36";
const USERAGENT_FIREFOX = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:70.0) Gecko/20100101 Firefox/70.0";
const searchStrings = {
    google: "https://google.com/search?q=",
    bing: "https://www.bing.com/search?q=",
    duckduckgo: "https://duckduckgo.com/?q="
}
const defaultHomePage = "file://" + __dirname + "/homepage/index.html";
//checking for command line parameters
var args = process.argv;

//importing prompt module
var prompt = require("./prompt");
const { readFileSync } = require("fs");
const { randomUUID } = require("crypto");

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
var first_startup = false;

(() => {
    //initializing general config file
    var config = settings.readData("general.conf.json");
    console.log("Configuration read: ", config);
    if (config == "{}") {
        config = {};
        settings.saveData("general.conf.json", JSON.stringify(config));
        //default config
        config["adblock"] = false;
        config["searchEngine"] = "duckduckgo";
        config["homePage"] = "default";
        settings.saveData("general.conf.json", JSON.stringify(config));
        first_startup = true;
    }

    //initializing experimental config file
    var config_exp = settings.readData("experimental.conf.json");
    console.log("Configuration read: ", config_exp);
    if (config_exp == "{}") {
        config_exp = {};
        settings.saveData("experimental.conf.json", JSON.stringify(config_exp));
        //default config
        config_exp["blur"] = false;
        settings.saveData("experimental.conf.json", JSON.stringify(config_exp));
    }

    //initializing download history

    var dlhistory = settings.readData("download.history.json");
    console.log("Download history read");
    if (dlhistory == "{}") {
        dlhistory = {};
        settings.saveData("download.history.json", JSON.stringify(dlhistory));
    }

})()

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
            e.returnValue = 0;
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

function initSetup() {
    const win = new BrowserWindow({
        minWidth: 800,
        minHeight: 600,
        title: "Carbon",
        frame: false,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            spellcheck: false,
            contextIsolation: false,
            nodeIntegration: true,
        }
    });

    win.loadFile("first-time-setup/index.html");
    win.show();
    attachControlHost(win);
    if (checkParameter("--debug")) {
        win.webContents.openDevTools();
    }

    win.on("closed", () => {
        initMainWindow();
    })
}

function initMainWindow() {
    var win = null;

    if (settings.readKeyFromFile("experimental.conf.json", "blur") == false) {
        win = new BrowserWindow({
            minWidth: 800,
            minHeight: 600,
            title: "Carbon",
            frame: false,
            show: false,
            webPreferences: {
                preload: path.join(__dirname, "preload.js"),
                spellcheck: false,
                contextIsolation: false,
                nodeIntegration: true,
            }
        });
    }
    else {
        win = new glasstron.BrowserWindow({
            minWidth: 800,
            minHeight: 600,
            title: "Carbon",
            frame: false,
            show: false,
            webPreferences: {
                preload: path.join(__dirname, "preload.js"),
                spellcheck: false,
                contextIsolation: false,
                nodeIntegration: true,
            }
        });

        if (process.platform != "win32") {
            win.blurType = "acrylic";
        }
        else {
            win.blurType = "blurbehind";
        }
        win.setBlur(true);
    }

    mainWin = win;
    win.maximize();

    setTimeout(() => {
        win.show()
    }, 1000);


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
                },
                {
                    label: 'Download Image',
                    visible: parameters.mediaType == "image",
                    click: () => {
                        win.webContents.downloadURL(parameters.srcURL);
                    }
                }
            ],
            window: view,
            showSearchWithGoogle: false,
            showInspectElement: false
        });


        function sendEvent(data) {
            console.log("Sending data to renderer: ", data);
            try {
                win.webContents.postMessage(uuid, data);
            } catch (error) {
                console.error(error);
            }
        }

        view.webContents.on("did-start-loading", () => {
            sendEvent({ type: "did-start-loading" })
        });
        view.webContents.on("did-stop-loading", () => {
            var utype = null;
            if (new URL(view.webContents.getURL()).href == new URL(defaultHomePage).href) {
                utype = "home";
            }
            sendEvent({ type: "did-stop-loading", urltype: utype });
            //changing user agent if needed for google account login
            if (new URL(view.webContents.getURL()).host == "accounts.google.com" && view.webContents.getUserAgent() != USERAGENT_FIREFOX) {
                view.webContents.setUserAgent(USERAGENT_FIREFOX);
                view.webContents.reload();
                return;
            }

            if (new URL(view.webContents.getURL()).host != "accounts.google.com" && view.webContents.getUserAgent() == USERAGENT_FIREFOX) {
                view.webContents.setUserAgent(USERAGENT);
                view.webContents.reload();
                return;
            }
        });

        view.webContents.on("media-started-playing", () => {
            sendEvent({ type: "media-started-playing" });
        })

        view.webContents.on("media-paused", () => {
            sendEvent({ type: "media-paused" });
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
            try {
                view.setBounds({ width: win.getBounds().width, height: win.getBounds().height, x: 0, y: y });
            } catch (error) {

            }
        }, 500);
    });

    ipcMain.on("removeTab", (e, uuid) => {
        const view = webviews[uuid];
        view.webContents.destroy();
        delete webviews[uuid];
        e.returnValue = 0;
    })

    ipcMain.on("mute", (e, uuid) => {
        e.returnValue = 0;
        console.log("Mute requested to tab: " + uuid);
        const view = webviews[uuid];
        console.log(view);
        if (view.webContents.isAudioMuted() == false) {
            view.webContents.setAudioMuted(true);
        }
        else {
            view.webContents.setAudioMuted(false);
        }
    });

    ipcMain.on("openDevTools", (e, uuid) => {
        const view = webviews[uuid];
        view.webContents.openDevTools();
        e.returnValue = 0;
    })

    ipcMain.on("navigate", (e, data) => {
        const view = webviews[data.uuid];
        if (data.url == "home") {
            var home = settings.readKeyFromFile("general.conf.json", "homePage");
            if (home == "default") {
                view.webContents.loadURL(defaultHomePage);
            }
            else {
                view.webContents.loadURL(home);
            }
        }
        else {
            view.webContents.loadURL(data.url);
        }
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
        try {
            if (new URL(view.webContents.getURL()).href == new URL(defaultHomePage).href) {
                e.returnValue = "";
                return;
            }
        } catch (error) {

        }
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
        }
    }),
    opendownloads: new MenuItem({
        label: "Downloads",
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

            win.loadFile("downloads-gui/index.html");



            attachControlHost(win);

            if (checkParameter("--debug")) {
                win.webContents.openDevTools();
            }
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

app.whenReady().then(() => {
    setTimeout(() => {
        //some ipc listeners
        ipcMain.on("getVersion", (e) => {
            var data = readFileSync(__dirname + "/package.json", "utf-8");
            data = JSON.parse(data)
            e.returnValue = data.version;
        })

        ipcMain.on("searchString", (e) => {
            var setting = settings.readKeyFromFile("general.conf.json", "searchEngine");
            e.returnValue = searchStrings[setting]
        });

        ipcMain.on("searchEngines", (e) => {
            e.returnValue = Object.keys(searchStrings);
        });

        first_startup = checkParameter("--setup");
        var openFirst = null;

        ipcMain.once("openFirst", (e) => {
            e.returnValue = openFirst;
        });

        for (var x in process.argv) {
            if (x > 0) {
                try {
                    new URL(process.argv[x]);
                    console.log("Argument is url: ", process.argv[x]);
                    openFirst = process.argv[x];
                } catch (error) {
                    console.log("Argument is not url: ", process.argv[x]);
                }
            }
        }

        if (first_startup == false) {
            initMainWindow();
        }
        else {
            initSetup();
        }
    }, 1000);
});

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
        try {
            if (permission == "media") {
                return true;
            }
        } catch (error) {
            console.error(error);
        }
    });

    //download handling 

    var current_downloads = {};
    var dlitems = {};

    session.defaultSession.on("will-download", (e, item, webcontents) => {
        const DLID = randomUUID();
        dlitems[DLID] = item;
        var received = 0;
        item.on('updated', (event, state) => {
            if (state == 'interrupted') {
                console.log('Download is interrupted but can be resumed');
                current_downloads[DLID] = {
                    "state": "paused",
                    "received": received,
                    "file": item.getFilename(),
                    "url": item.getURL(),
                    "total": item.getTotalBytes()
                }
            } else if (state === 'progressing') {
                if (item.isPaused()) {
                    console.log('Download is paused')
                    current_downloads[DLID] = {
                        "state": "paused",
                        "received": received,
                        "file": item.getFilename(),
                        "url": item.getURL(),
                        "total": item.getTotalBytes()
                    }
                } else {
                    received = item.getReceivedBytes();
                    current_downloads[DLID] = {
                        "state": state,
                        "received": received,
                        "file": item.getFilename(),
                        "url": item.getURL(),
                        "total": item.getTotalBytes()
                    }
                }
            }
        })
        item.once('done', (event, state) => {
            if (state == 'completed') {
                var date = new Date();
                console.log('Download successfully')
                var saved_downloads = JSON.parse(settings.readData("download.history.json"));
                saved_downloads[DLID] = {
                    "file": item.getFilename(),
                    "url": item.getURL(),
                    "time": date.getTime()
                }
                settings.saveData("download.history.json", JSON.stringify(saved_downloads));
            } else {
                console.log(`Download failed: ${state}`)
            }

            delete current_downloads[DLID];
        })

    })

    ipcMain.on("cancel", (e, dlid) => {
        console.log("Download cancelled", dlid);
        dlitems[dlid].cancel();
    })

    ipcMain.on("pause", (e, dlid) => {
        console.log("Download paused", dlid);
        if (dlitems[dlid].isPaused()) {
            dlitems[dlid].resume();
        }
        else {
            dlitems[dlid].pause();
        }
    })

    ipcMain.on("getDownloads", (e) => {
        e.returnValue = JSON.stringify(current_downloads);
    })

    //adblock
    const fetch = require("cross-fetch").fetch

    ElectronBlocker.fromPrebuiltAdsAndTracking(fetch).then(async (blocker) => {
        function enable() {
            blocker.enableBlockingInSession(session.defaultSession);
            console.log("Adblock enabled")
        }

        function disable() {
            blocker.disableBlockingInSession(session.defaultSession);
            console.log("Adblock disabled")
        }

        const isEnabled = JSON.parse(settings.readData("general.conf.json")).adblock;

        if (isEnabled) {
            enable();
        }

        ipcMain.on("enableAdblock", (e) => {
            enable();
            e.returnValue = 0;
        })
        ipcMain.on("disableAdblock", (e) => {
            disable();
            e.returnValue = 0;
        })
    });

});

process.on("uncaughtException", (e) => {
    console.log(e.name, e.message, e.stack);
})