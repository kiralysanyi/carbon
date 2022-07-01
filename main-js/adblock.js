const { app, session, ipcMain } = require("electron");
const settings = require("./settings");
const { ElectronBlocker } = require("@cliqz/adblocker-electron")


app.on('session-created', function () {
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