const { autoUpdater } = require("electron-updater");
const prompt = require("./prompt");
const { Notification, app, BrowserWindow } = require("electron");
const settings = require("./settings")

var info;
var update_in_progress = false;
var update_percent = 0;
var update_downloaded = false;

autoUpdater.allowDowngrade = false;
autoUpdater.allowPrerelease = false;
const autoupdate = settings.readKeyFromFile("general.conf.json", "auto-update")


const runUpdate = async (ipc_callback) => {
    ipc_callback("update-state", "Checking...");
    autoUpdater.autoDownload = false;
    autoUpdater.disableWebInstaller = true;

    try {
        info = await autoUpdater.checkForUpdates();
        if (info.updateInfo.version.includes("beta") == true && settings.readKeyFromFile("general.conf.json", "update-channel") != "beta") {
            ipc_callback("update-state", "Couldn't download beta version because only stable version is allowed.");
            return;
        }
        if (autoUpdater.currentVersion.compare(info.updateInfo.version) == 0) {
            ipc_callback("update-state", "Up to date");
            return;
        }
        ipc_callback("show-update-button");
        if (autoupdate == true) {
            ipc_callback("hide-update");
            update_in_progress = true;
            ipc_callback("show-update-loader");
            autoUpdater.autoInstallOnAppQuit = true;
            autoUpdater.downloadUpdate();
        }
    } catch (error) {
        ipc_callback("update-state", "Failed to check for updates :(");
        ipc_callback("hide-update-button")
        console.error(error);
    }

}

const startUpdate = async (ipc_callback) => {
    if (update_in_progress == true) {
        const update_prompt = new prompt.updateDisplay("Current Version: " + app.getVersion() + " \n Version: " + info.updateInfo.version + " \n Notes: \n" + info.updateInfo.releaseNotes)
        update_prompt.show();
        var interval = setInterval(() => {
            update_prompt.update(update_percent);
            if (update_downloaded == true) {
                clearInterval(interval);
                update_prompt.update(100);
            }
        }, 1000);

    } else {
        var answer;
        if (info == undefined) {
            prompt.updatePrompt("No updates available.", "updateprompt");
            return;
        }
        answer = await prompt.updatePrompt("Do you want to update? \n Current Version: " + app.getVersion() + " \n Version: " + info.updateInfo.version + " \n Notes: \n" + info.updateInfo.releaseNotes, "updateprompt")
        runInfoUpdate();
        if (answer == true) {
            runInfoUpdate();
            ipc_callback("show-update-loader");
            ipc_callback("hide-update");
            autoUpdater.autoInstallOnAppQuit = true;
            autoUpdater.downloadUpdate();
        }
    }

}

var updateInstallTrigger = false;
function installOnQuit() {
    if (updateInstallTrigger == true) {
        return;
    }
    updateInstallTrigger = true;
    app.on("window-all-closed", () => {
        console.log("Goodbye!")
        app.quit();
    })
}

autoUpdater.on("download-progress", (e) => {
    installOnQuit();
    update_percent = e.percent;
    console.log("Update: ", e.percent);
    update_in_progress = true;
    runInfoUpdate();
})
autoUpdater.on("update-downloaded", () => {
    console.log("Update downloaded");
    runInfoUpdate();
})

function errorNotify() {
    if(BrowserWindow.getAllWindows().length == 0) {
        return;
    }
    new Notification({ title: "Carbon error", body: "Failed to update carbon." }).show();
}

autoUpdater.on("error", () => {
    runInfoUpdate();
    errorNotify();
})


var onInfoUpdate = null;

const runInfoUpdate = () => {
    if (onInfoUpdate) {
        onInfoUpdate();
    }
}

module.exports = {
    autoUpdater,
    startUpdate,
    runUpdate,
    info,
    update_in_progress,
    update_percent,
    onInfoUpdate
}