const { autoUpdater } = require("electron-updater");
const { readFileSync } = require("fs");
const prompt = require("./prompt");
const {Notification, app} = require("electron");
const settings = require("./settings")

var info;
var update_in_progress = false;
var update_percent = 0;
var update_downloaded = false;

autoUpdater.allowDowngrade = false;
autoUpdater.allowPrerelease = false;

const runUpdate = async (mainWin) => {
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
            update_in_progress = true;
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

const startUpdate = async (mainWin) => {
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
        var answer = await prompt.updatePrompt("Do you want to update? \n Current Version: " + data.version + " \n Version: " + info.updateInfo.version + " \n Notes: \n" + info.updateInfo.releaseNotes, "updateprompt")
        runInfoUpdate();
        if (answer == true) {
            runInfoUpdate();
            mainWin.webContents.send("show-update-loader");
            autoUpdater.autoInstallOnAppQuit = true;
            autoUpdater.downloadUpdate();
        }
    }

}

autoUpdater.on("download-progress", (e) => {
    update_percent = e.percent;
    console.log("Update: ", e.percent);
    update_in_progress = true;
    runInfoUpdate();
})
autoUpdater.on("update-downloaded", () => {
    console.log("Update downloaded");
    runInfoUpdate();
})

autoUpdater.on("error", () => {
    runInfoUpdate();
    new Notification({ title: "Carbon error", body: "Failed to update carbon." }).show();
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