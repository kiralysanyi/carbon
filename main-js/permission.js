const { app, session, ipcMain, webContents, BrowserWindow } = require("electron");
const prompt = require("./prompt");
const settings = require("./settings");


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

let attachPermissionHandler = (winID, mainWindow = new BrowserWindow(), webcontents = new webContents()) => {
    console.log("Attaching permission handler: ", winID);
    webcontents.session.setPermissionRequestHandler(async (webcontents, permission, callback) => {
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

        console.log(host, " asked for permission: ", permission);

        ipcMain.once(permission + winID, (e, answer) => {
            if (permissions[host]) {
                permissions[host][permission] = answer;
            }
            else {
                permissions[host] = {};
                permissions[host][permission] = answer;
            }
            savePermissions();
            callback(answer);
            console.log("Answer to permission request: ", answer)
            return answer;
        })

        mainWindow.webContents.send("permissionPrompt", winID, permission, host);
    });
}

app.on("session-created", () => {


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
})

module.exports = { attachPermissionHandler }