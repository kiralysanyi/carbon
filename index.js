const { app, BrowserWindow, ipcMain, session, BrowserView, MenuItem, Menu, webContents, Notification, shell, components } = require("electron");
app.commandLine.appendSwitch("enable-transparent-visuals");
const contextMenu = require('electron-context-menu');
const settings = require("./settings");
const path = require("path");
const { ElectronBlocker } = require("@cliqz/adblocker-electron")
const { autoUpdater } = require("electron-updater")
const { readFileSync, existsSync } = require("fs");
console.log("Carbon is starting on platform: ", process.platform)

var package_data = readFileSync(__dirname + "/package.json", "utf-8");
package_data = JSON.parse(package_data)

autoUpdater.allowDowngrade = false;
autoUpdater.allowPrerelease = false;

//useragent
var USERAGENT_FIREFOX = 'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:FXVERSION.0) Gecko/20100101 Firefox/FXVERSION.0';
var USERAGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.63 Safari/537.36";

if (process.platform == "linux") {
    USERAGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.36";
    USERAGENT_FIREFOX = "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:FXVERSION.0) Gecko/20100101 Firefox/FXVERSION.0";
}

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
    var config = JSON.parse(settings.readData("general.conf.json"));
    if (Object.keys(config).length == 0) {
        //default config
        config["versionindex"] = package_data["version_index"];
        config["adblock"] = false;
        config["searchEngine"] = "duckduckgo";
        config["homePage"] = "default";
        config["update-channel"] = "stable";
        config["auto-update"] = false;
        settings.saveData("general.conf.json", JSON.stringify(config));
        first_startup = true;
    }

    if (!config["versionindex"]) {
        config["versionindex"] = package_data["version_index"];
    }

    if (config["versionindex"] < package_data["version_index"]) {
        console.log("Upgrade detected");

        //enable auto updates below version index 2
        if (config["version_index"] < 0) {
            config["auto-update"] = true;
            settings.saveData("general.conf.json", JSON.stringify(config));
        }
    }

    //initializing experimental config file
    var config_exp = settings.readData("experimental.conf.json");
    console.log("Configuration read: ", config_exp);
    if (config_exp == "{}") {
        config_exp = {};
        settings.saveData("experimental.conf.json", JSON.stringify(config_exp));
        //default config
        config_exp["immersive_interface"] = false;
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

//init update system
var info;
autoUpdater.on("download-progress", (e) => {
    mainWin.webContents.send("update-state", "Downloading update...");
})
autoUpdater.on("update-downloaded", () => {
    mainWin.webContents.send("update-state", "Update downloaded, ready to install.");
    mainWin.webContents.send("hide-update-button")
})

autoUpdater.on("error", () => {
    mainWin.webContents.send("update-state", "Failed :(");
    mainWin.webContents.send("hide-update-button")
    new Notification({ title: "Carbon error", body: "Failed to update carbon." }).show();
})

if (settings.readKeyFromFile("general.conf.json", "auto-update")) {
    autoUpdater.autoDownload = true;
}


const runUpdate = async () => {

    mainWin.webContents.send("update-state", "Checking...");
    autoUpdater.autoDownload = false;
    autoUpdater.disableWebInstaller = true;

    try {
        info = await autoUpdater.checkForUpdates();
        if (info.updateInfo.version.includes("beta") == true && settings.readKeyFromFile("general.conf.json", "update-channel") != "beta") {
            mainWin.webContents.send("update-state", "Couldn't download beta version because only stable version is allowed.");
            return;
        }
        if (autoUpdater.currentVersion.compare(info.updateInfo.version) == 0) {
            mainWin.webContents.send("update-state", "Up to date");
            return;
        }
        mainWin.webContents.send("show-update-button");
        const autoupdate = settings.readKeyFromFile("general.conf.json", "auto-update")
        if (autoupdate == true) {
            mainWin.webContents.send("show-update-loader");
            autoUpdater.autoInstallOnAppQuit = true;
            autoUpdater.downloadUpdate();
        }
    } catch (error) {
        mainWin.webContents.send("update-state", "Failed to check for updates :(");
        mainWin.webContents.send("hide-update-button")
        new Notification({ title: "Carbon error", body: "Failed to update carbon." }).show();
        console.error(error);
    }

}

const startUpdate = async () => {
    var data = readFileSync(__dirname + "/package.json", "utf-8");
    data = JSON.parse(data)
    var answer = await prompt.updatePrompt("Do you want to update? \n Current Version: " + data.version + " \n Version: " + info.updateInfo.version + " \n Notes: \n" + info.updateInfo.releaseNotes, "updateprompt")
    if (answer == true) {
        mainWin.webContents.send("show-update-loader");
        autoUpdater.autoInstallOnAppQuit = true;
        autoUpdater.downloadUpdate();
    }
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
    if (checkParameter("--carbon-debug")) {
        win.webContents.openDevTools();
    }

    win.on("closed", () => {
        initMainWindow();
    })
}

function initMainWindow() {
    var win = new BrowserWindow({
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
            webviewTag: true,
            nodeIntegrationInSubFrames: true,
            plugins: true
        }
    });



    mainWin = win;
    win.maximize();

    setTimeout(() => {
        win.show();
        runUpdate();
    }, 1000);


    win.loadFile("app/index.html");
    win.removeMenu();

    attachControlHost(win);

    if (checkParameter("--carbon-debug")) {
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
    var focusedTab = null;
    const errorTracker = {};

    ipcMain.on("newTab", (e, data) => {
        const view = new BrowserView({
            webPreferences: {
                preload: path.join(app.getAppPath(), 'view_preload.js'),
                contextIsolation: false,
                plugins: true
            }
        });
        view.webContents.setUserAgent(USERAGENT);
        win.setBrowserView(view);
        view.setBounds({ width: win.getBounds().width, height: win.getBounds().height - 90, x: 0, y: 90 });
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

        view.webContents.on("did-navigate", () => {
            if (new URL(view.webContents.getURL()).href != new URL(defaultHomePage).href && errorTracker[uuid] != true) {
                saveHistory();
            }
        })

        view.webContents.on("will-navigate", () => {
            sendEvent({ type: "did-start-loading" })
        });

        view.webContents.on("did-navigate", () => {
            sendEvent({ type: "did-navigate" });
        })

        view.webContents.on("did-start-loading", () => {
            errorTracker[uuid] = false;
            sendEvent({ type: "did-start-loading" })
        });

        view.webContents.on("did-fail-load", (e, code, description) => {
            if (code == "-27" || code == "-3" || code == "-30" || code == "-20") {
                console.log("Reporting of error " + code + " is cancelled")
                return
            }
            errorTracker[uuid] = true;
            sendEvent({ type: "did-fail-load", code: code, description: description });
            console.log("Error: ", code, description);
        })

        view.webContents.on("did-navigate", () => {
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
            saveHistory();
            sendEvent({ type: "page-title-updated", title: view.webContents.getTitle() });
        });

        var currentIcon = null;

        function saveHistory() {
            if (new URL(view.webContents.getURL()).href == new URL(defaultHomePage).href) {
                return;
            }
            const history = JSON.parse(settings.readData("history.json", "{}"));
            history[view.webContents.getURL()] = {
                title: view.webContents.getTitle(),
                url: view.webContents.getURL(),
                iconURL: currentIcon
            };
            settings.saveData("history.json", JSON.stringify(history));
        }

        view.webContents.on("page-favicon-updated", (e, favicons) => {
            sendEvent({ type: "page-favicon-updated", favicons: favicons });
            currentIcon = favicons[0];
            try {
                const history = JSON.parse(settings.readData("history.json", "{}"));
                history[view.webContents.getURL()].iconURL = favicons[0];
                settings.saveData("history.json", JSON.stringify(history));
            } catch (error) {
                saveHistory();
                const history = JSON.parse(settings.readData("history.json", "{}"));
                history[view.webContents.getURL()].iconURL = favicons[0];
                settings.saveData("history.json", JSON.stringify(history));
            }
        });

        view.webContents.on("did-change-theme-color", (e, color) => {
            sendEvent({ type: "color-change", color: color });
        })

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
                view.setBounds({ width: win.getBounds().width, height: win.getBounds().height - y, x: 0, y: y });
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
    });


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

    ipcMain.on("getHomeURL", (e) => {
        e.returnValue = defaultHomePage;
    })

    ipcMain.on("getUrl", (e, uuid) => {
        if (errorTracker[uuid] != true) {
            const view = webviews[uuid];
            try {
                if (new URL(view.webContents.getURL()).href == new URL(defaultHomePage).href) {
                    e.returnValue = "";
                    return;
                }
            } catch (error) {

            }

            e.returnValue = view.webContents.getURL();
        } else {
            e.returnValue = "no_change";
        }
    })

    ipcMain.on("focusTab", (e, uuid) => {
        const view = webviews[uuid];
        win.setBrowserView(view);
        win.setTopBrowserView(view);
        focusedTab = view;
        e.returnValue = 0;
    })

    var denyRequest = false;
    app.addListener("before-quit", () => {
        denyRequest = true;
    })

    ipcMain.on("getBase64", (e) => {
        if (denyRequest == true) {
            return;
        }
        var view = focusedTab;
        view.webContents.capturePage({ x: 0, y: 0, width: mainWin.getBounds().width, height: 90 }).then((image) => {
            mainWin.webContents.send("base64", image.toDataURL())
        });
    });

    ipcMain.on("hideCurrentTab", (e) => {
        var view = focusedTab;
        view.webContents.capturePage().then((image) => {
            e.returnValue = image.toDataURL();
            win.removeBrowserView(focusedTab);
        });
    })

    ipcMain.on("showCurrentTab", (e) => {
        win.setBrowserView(focusedTab);
        e.returnValue = 0;
    });

    ipcMain.on("hideTab", (e, uuid) => {
        const view = webviews[uuid];
        win.removeBrowserView(view);
        e.returnValue = 0;
    })
}

ipcMain.on("opendownloads", () => {
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

    if (checkParameter("--carbon-debug")) {
        win.webContents.openDevTools();
    }
})


ipcMain.on("isDebug", (e) => {
    e.returnValue = checkParameter("--carbon-debug")
})

app.whenReady().then(async () => {
    await components.whenReady();
    console.log('components ready:', components.status());
    ipcMain.on("checkUpdate", () => {
        runUpdate();
    })

    ipcMain.on("start-update", () => {
        startUpdate();
    })

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

        if (checkParameter("--setup")) {
            first_startup = true;
        }
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

        for (var x in process.argv) {
            if (x > 0) {
                if (existsSync(process.argv[x]) && process.argv[x] != ".") {
                    console.log("Argument is path: ", process.argv[x]);
                    openFirst = "file://" + process.argv[x];
                } else {
                    console.log("Argument is not a path: ", process.argv[x]);
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

        if (permission == "pointerLock") {
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

        if (permission == "sensors") {
            console.log("NOTE: sensor api disabled");
            callback(false);
            return false;
        }

        if (permission == "media") {
            var answer = await prompt.confirm("Do you want to grant audio/video permission for " + host + " ?", host + permission);
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
        var answer = await prompt.confirm("Do you want to grant permission: " + permission + " for " + host + " ?", host + permission);
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
        new Notification({ title: "Download information", body: "Download has been started: " + item.getFilename() }).show()
        const DLID = randomUUID();
        dlitems[DLID] = item;
        var received0 = 0
        var speed = 0;
        var received = 0;
        item.on('updated', (event, state) => {
            if (state == 'interrupted') {
                console.log('Download is interrupted but can be resumed');
                current_downloads[DLID] = {
                    "state": "paused",
                    "received": received,
                    "file": item.getFilename(),
                    "url": item.getURL(),
                    "total": item.getTotalBytes(),
                    "speed": 0
                }
            } else if (state === 'progressing') {
                if (item.isPaused()) {
                    console.log('Download is paused')
                    current_downloads[DLID] = {
                        "state": "paused",
                        "received": received,
                        "file": item.getFilename(),
                        "url": item.getURL(),
                        "total": item.getTotalBytes(),
                        "speed": 0
                    }
                } else {
                    received = item.getReceivedBytes();
                    speed = received - received0;
                    received0 = received;
                    current_downloads[DLID] = {
                        "state": state,
                        "received": received,
                        "file": item.getFilename(),
                        "url": item.getURL(),
                        "total": item.getTotalBytes(),
                        "speed": speed
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
                new Notification({ title: "Download information", body: "Download has been completed: " + item.getFilename() }).show()
            } else {
                console.log(`Download failed: ${state}`)
                new Notification({ title: "Download information", body: "Download failed: " + item.getFilename() }).show()
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
    console.error(e.name, e.message, e.stack);
})
