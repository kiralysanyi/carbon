const {app, session} = require("electron");
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

app.on("session-created", () => {
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
})