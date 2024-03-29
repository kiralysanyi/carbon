const { app, BrowserWindow, ipcMain, BrowserView, components, globalShortcut } = require("electron");
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
    console.log("Cannot lock instance")
    app.exit()
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        console.log(commandLine)
        var starturl = null;
        for (var x in commandLine) {
            if (x > 0) {
                try {
                    new URL(commandLine[x]);
                    console.log("Argument is url: ", commandLine[x]);
                    starturl = commandLine[x];
                } catch (error) {
                    console.log("Argument is not url: ", commandLine[x]);
                }
            }
        }
        initMainWindow(starturl);
    })
}

var overlayConf = {
    height: 40,
    color: "#1b1b1b",
    symbolColor: "white"
}

const trafficLightPosition = {
    x: 10,
    y: 16
}

const contextMenu = require('electron-context-menu');
const settings = require("./main-js/settings");
const path = require("path");
const { readFileSync, existsSync } = require("fs");
const configurator = require("./main-js/configurator");
require("./main-js/download_backend");
require("./main-js/adblock");
const { getStartupConfig, updateStartupConfig } = require("./main-js/autostart");
const shortcutRegister = require("./main-js/shortcut_register");
const persistent = require("./main-js/persistent_variables");
var args = process.argv;
const { endCapture } = require("./main-js/capture_backend");

ipcMain.on("isAutoStarting", (e) => {
    console.log("Startup config: ", getStartupConfig());
    e.returnValue = getStartupConfig();
})

ipcMain.on("updateAutoStartConfig", (e, value) => {
    updateStartupConfig(value);
})

function checkParameter(name) {
    for (var x in args) {
        if (args[x] == name) {
            return true;
        }
    }

    return false;
}

let startup = getStartupConfig();

if (checkParameter("--nowindowinit")) {
    if (startup == false) {
        app.exit();
    }
}

if (checkParameter("--verbose") == false) {
    console.log = () => { };
}


console.log("Carbon is starting on platform: ", process.platform);
console.log("Version: ", app.getVersion())
var first_startup = configurator.first_startup;

const searchStrings = {
    google: "https://google.com/search?q=",
    bing: "https://www.bing.com/search?q=",
    duckduckgo: "https://duckduckgo.com/?q="
}
const defaultHomePage = "file://" + __dirname + "/homepage/index.html";
//checking for command line parameters

//importing prompt module
const prompt = require("./main-js/prompt");

//getting the useragent
const { USERAGENT, USERAGENT_FIREFOX } = require("./main-js/useragent-provider");
const { runUpdate, startUpdate } = require("./main-js/update-management");
const permission_handler = require("./main-js/permission");

const autoupdate = settings.readKeyFromFile("general.conf.json", "auto-update")

app.whenReady().then(() => {
    if (autoupdate == true) {
        runUpdate(sendToAll);
        setInterval(() => {
            runUpdate(sendToAll);
        }, 1800000);
    }
});


//init update system
const updateManager = require("./main-js/update-management");
const { randomUUID } = require("crypto");
var info = updateManager.info;
var update_in_progress = updateManager.update_in_progress;
var update_percent = updateManager.update_percent;
const autoUpdater = updateManager.autoUpdater;

updateManager.onInfoUpdate = () => {
    info = updateManager.info;
    update_in_progress = updateManager.update_in_progress;
    update_percent = updateManager.update_percent;
}


autoUpdater.on("download-progress", (e) => {
    update_percent = e.percent;
    sendToAll("update-state", "Downloading update...");
    update_in_progress = true;
})
autoUpdater.on("update-downloaded", () => {
    sendToAll("update-state", "Update downloaded, ready to install.");
    sendToAll("hide-update-button");
    sendToAll("show-update-button");
})

autoUpdater.on("error", () => {
    sendToAll("update-state", "Failed :(");
    sendToAll("hide-update-button")
})

if (settings.readKeyFromFile("general.conf.json", "auto-update")) {
    autoUpdater.autoDownload = true;
}


const windows = {};

const sendToAll = (channel, data) => {
    for (var x in windows) {
        windows[x].webContents.send(channel, data);
    }
}


var focused_window = null;


//main window creation
function initMainWindow(startupURL = null) {
    console.log(startupURL)
    const win = new BrowserWindow({
        trafficLightPosition: trafficLightPosition,
        minWidth: 800,
        minHeight: 600,
        title: "Carbon",
        frame: false,
        titleBarStyle: 'hidden',
        icon: __dirname + "/build/icon.png",
        titleBarOverlay: overlayConf,
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
    const winID = randomUUID();
    windows[winID] = win;

    win.webContents.on("ipc-message-sync", (e, channel) => {
        if (channel == "requestWinID") {
            e.returnValue = winID;
        }
    });

    win.maximize();

    win.show();
    if (checkParameter("--carbon-debug")) {
        win.webContents.openDevTools({ mode: "detach" });
    }

    //main window event handling
    win.on("focus", () => {
        focused_window = {
            win: win,
            focusedTab: () => {
                return focusedTab;
            }
        };
        shortcutRegister.unregister();
        shortcutRegister.register(focused_window, endCapture);
    })

    win.on("close", () => {
        delete windows[winID];
        for (var x in webviews) {
            const view = webviews[x];
            view.webContents.destroy();
        }
        shortcutRegister.unregister();
    })

    win.on("blur", () => {
        shortcutRegister.unregister();
    })

    if (process.platform == "darwin") {
        win.on("enter-full-screen", () => {
            win.webContents.send("enter_fullscreen_darwin")
        })

        win.on("leave-full-screen", () => {
            win.webContents.send("leave_fullscreen_darwin")
        })
    }

    win.loadFile("app/index.html");
    win.removeMenu();


    attachControlHost(win);

    var views = win.getBrowserViews();

    //tab management
    var webviews = {};
    var focusedTab = null;
    const errorTracker = {};
    var isFirstOpen = true;
    win.webContents.on("ipc-message-sync", (e, channel, data) => {
        if (channel == "addListeners") {
            views = win.getBrowserViews();
            for (var x in views) {
                views[x].webContents.addListener("new-window", (e, url) => {
                    e.preventDefault();
                })
            }
            e.returnValue = 0;
        }

        var uuid = data;

        //remove tab
        if (channel == "removeTab") {
            const view = webviews[uuid];
            view.webContents.destroy();
            delete webviews[uuid];
            e.returnValue = 0;
        }

        //mute audio of current tab
        if (channel == "mute") {
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
        }


        //open developer tools for current tab
        if (channel == "openDevTools") {
            const view = webviews[uuid];
            view.webContents.openDevTools({ mode: "detach" });
            e.returnValue = 0;
        }


        //navigate to the given URL in the current tab
        if (channel == "navigate") {
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
        }

        if (channel == "reload") {
            const view = webviews[uuid];
            view.webContents.reload();
            e.returnValue = 0;
        }

        if (channel == "goBack") {
            const view = webviews[uuid];
            view.webContents.goBack();
            e.returnValue = 0;
        }

        if (channel == "goForward") {
            const view = webviews[uuid];
            view.webContents.goForward();
            e.returnValue = 0;
        }

        if (channel == "canGoBack") {
            const view = webviews[uuid];
            e.returnValue = view.webContents.canGoBack();
        }

        if (channel == "canGoForward") {
            const view = webviews[uuid];
            e.returnValue = view.webContents.canGoForward();
        }

        if (channel == "getUrl") {
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
        }

        if (channel == "focusTab") {
            const view = webviews[uuid];
            win.setBrowserView(view);
            view.webContents.capturePage().then((image) => {
                win.webContents.postMessage(uuid, { type: "preview", image: image.resize({ height: 800, quality: "good" }).toDataURL() });
            });
            focusedTab = view;
            e.returnValue = 0;
            if (win.isFocused()) {
                focused_window = {
                    win: win,
                    focusedTab: focusedTab
                };
            };
        }

        //hide current tab and send back a preview of the tab
        if (channel == "hideCurrentTab") {
            var view = focusedTab;
            view.webContents.capturePage().then((image) => {
                e.returnValue = image.resize({ height: 400, quality: "good" }).toDataURL();
                win.removeBrowserView(focusedTab);

            });
        }

        if (channel == "showCurrentTab") {
            win.setBrowserView(focusedTab);
            e.returnValue = 0;
        }

        if (channel == "hideTab") {
            const view = webviews[uuid];
            win.removeBrowserView(view);
            e.returnValue = 0;
        }

        //new tab
        if (channel == "newTab") {

            const view = new BrowserView({
                webPreferences: {
                    preload: path.join(app.getAppPath(), 'view_preload.js'),
                    contextIsolation: false,
                    plugins: true,
                    sandbox: false,
                    nodeIntegration: false,
                }
            });

            if (isFirstOpen == true) {
                if (startupURL != null) {
                    view.webContents.once("dom-ready", () => {
                        view.webContents.loadURL(startupURL);
                    })
                }
            }
            permission_handler.attachPermissionHandler(winID, win, view.webContents);

            isFirstOpen = false;
            view.webContents.setUserAgent(USERAGENT);

            win.setBrowserView(view);
            view.setBounds({ width: win.getBounds().width, height: win.getBounds().height - 90, x: 0, y: 90 });
            webviews[data.uuid] = view;
            const uuid = data.uuid;
            e.returnValue = 0;

            if (channel == "updatePreview") {
                view.webContents.capturePage().then((image) => {
                    sendEvent({ type: "preview", image: image.resize({ height: 800, quality: "good" }).toDataURL() });
                });

            }


            //adding context menu to webview
            contextMenu({
                prepend: (defaultActions, parameters, browserview) => [
                    {
                        label: "Back",
                        visible: view.webContents.canGoBack(),
                        click: () => {
                            view.webContents.goBack();
                        }
                    },
                    {
                        label: "Forward",
                        visible: view.webContents.canGoForward(),
                        click: () => {
                            view.webContents.goForward();
                        }
                    },
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


            //sending event to renderer (main window)
            function sendEvent(data) {
                try {
                    win.webContents.postMessage(uuid, data);
                } catch (error) {
                    console.error(error);
                }
            }

            //webview event handling
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

                view.webContents.capturePage().then((image) => {
                    sendEvent({ type: "preview", image: image.resize({ height: 400, quality: "good" }).toDataURL() });
                });
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
                view.webContents.capturePage().then((image) => {
                    sendEvent({ type: "preview", image: image.resize({ height: 400, quality: "good" }).toDataURL() });
                });
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
                view.webContents.capturePage().then((image) => {
                    sendEvent({ type: "preview", image: image.resize({ height: 400, quality: "good" }).toDataURL() });
                });
                sendEvent({ type: "color-change", color: color });
            })

            view.webContents.setWindowOpenHandler((details) => {
                sendEvent({ type: "new-window", url: details.url });
                return { action: 'deny' }
            })

            var isFullScreen = false;

            view.webContents.on("enter-html-full-screen", () => {
                view.webContents.capturePage().then((image) => {
                    sendEvent({ type: "preview", image: image.resize({ height: 400, quality: "good" }).toDataURL() });
                });
                isFullScreen = true;
            })

            view.webContents.on("leave-html-full-screen", () => {
                view.webContents.capturePage().then((image) => {
                    sendEvent({ type: "preview", image: image.resize({ height: 400, quality: "good" }).toDataURL() });
                });
                isFullScreen = false;
            })


            //workaround for inappropriate webview resize on windows
            setInterval(() => {
                var y = 0;
                if (isFullScreen == true) {
                    y = 0;
                }
                else {
                    y = 90;
                }
                try {
                    if (process.platform == "win32" && win.isMaximized() == true && isFullScreen == false) {
                        view.setBounds({ width: win.getBounds().width - 15, height: win.getBounds().height - 105, x: 0, y: y });
                        return;
                    }
                    view.setBounds({ width: win.getBounds().width, height: win.getBounds().height - y, x: 0, y: y });
                } catch (error) {

                }
            }, 500);

        }

    })
    var denyRequest = false;

    var interval;
    if (configurator.config_exp["immersive_interface"] == true) {
        console.log("Enabling immersive interface");
        interval = setInterval(() => {
            if (denyRequest == true) {
                return;
            }
            var view = focusedTab;
            view.webContents.capturePage({ x: 0, y: 0, width: win.getBounds().width, height: 40 }).then((image) => {
                win.webContents.send("base64", image.toDataURL());
            });
        }, 100);
    }


    win.once("close", () => {
        denyRequest = true;
        if (interval) {
            clearInterval(interval);
        }
    })
}

ipcMain.on("getHomeURL", (e) => {
    e.returnValue = defaultHomePage;
})

function attachControlHost(win) {
    let applyTheme = () => {
        if (settings.readKeyFromFile("general.conf.json", "theme") == "light") {
            overlayConf.color = "#FFFFFF"
            overlayConf.symbolColor = "black";
        } else {
            overlayConf.color = "#1b1b1b";
            overlayConf.symbolColor = "white";
        };
        win.setTitleBarOverlay(overlayConf);
        win.webContents.send("applyTheme", settings.readKeyFromFile("general.conf.json", "theme"));
    }

    let removeBlur = () => {
        win.webContents.send("removeBlur", settings.readKeyFromFile("experimental.conf.json", "remove_blur"));
    }

    win.webContents.on("did-finish-load", () => {
        applyTheme();
        removeBlur();
    });

    ipcMain.on("applyTheme", applyTheme)
    ipcMain.on("removeBlur", removeBlur);

    win.once("closed", () => {
        ipcMain.removeListener("applyTheme", applyTheme);
        ipcMain.removeListener("removeBlur", removeBlur);
    })

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
        trafficLightPosition: trafficLightPosition,
        minWidth: 800,
        minHeight: 600,
        title: "Carbon",
        frame: false,
        titleBarStyle: 'hidden',
        titleBarOverlay: overlayConf,
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
        win.webContents.openDevTools({ mode: "detach" });
    }

    win.on("closed", () => {
        initMainWindow();
    })
}


ipcMain.on("opendownloads", () => {
    const win = new BrowserWindow({
        trafficLightPosition: trafficLightPosition,
        minWidth: 800,
        minHeight: 600,
        frame: false,
        titleBarStyle: 'hidden',
        titleBarOverlay: overlayConf,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: false
        }
    })

    win.loadFile("downloads-gui/index.html");

    attachControlHost(win);

    if (checkParameter("--carbon-debug")) {
        win.webContents.openDevTools({ mode: "detach" });
    }
})


ipcMain.on("isDebug", (e) => {
    e.returnValue = checkParameter("--carbon-debug")
})


app.whenReady().then(async () => {
    if (process.platform == "linux") {
        if (process.env.XDG_SESSION_TYPE == "wayland") {
            if (persistent.readVariable("wayland_error_shown") != true) {
                persistent.setVariable("wayland_error_shown", true)
                prompt.alert("We have detected that you are running Carbon on Wayland. This could result in some bugs while using the application.");
            }
        }
    }

    await components.whenReady();



    console.log('components ready:', components.status());
    ipcMain.on("checkUpdate", () => {
        runUpdate(sendToAll);
    })

    ipcMain.on("start-update", () => {
        startUpdate(sendToAll);
    })

    setTimeout(() => {
        //some ipc listeners
        ipcMain.on("getVersion", (e) => {
            e.returnValue = app.getVersion();
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

        ipcMain.on("getTheme", (e) => {
            e.returnValue = settings.readKeyFromFile("general.conf.json", "theme");
        });

        ipcMain.on("isBlurRemoved", (e) => {
            e.returnValue = settings.readKeyFromFile("experimental.conf.json", "remove_blur");
        });

        //load password manager backend
        require("./main-js/password_manager");

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
            if (checkParameter("--nowindowinit") == false) {
                initMainWindow(openFirst);
            }
        }
        else {
            initSetup();
        }

    }, 1000);
});
process.on("uncaughtException", (e) => {
    console.error(e.name, e.message, e.stack);
})


app.on('window-all-closed', (e) => {
    e.preventDefault();
    let shouldExit = settings.readKeyFromFile("experimental.conf.json", "disableFastStartup");
    if (shouldExit == true) {
        app.exit();
    }
})

ipcMain.on("restart", () => {
    app.relaunch();
    app.quit();
})

if (process.platform == "darwin") {
    var isAllClosed = false;
    app.on("window-all-closed", () => {
        isAllClosed = true;
    })

    app.on("browser-window-created", () => {
        isAllClosed = false;
    })

    app.on("activate", () => {
        if (isAllClosed == true) {
            initMainWindow();
        }
    })
}