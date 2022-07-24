const { app } = require("electron");
const { readKeyFromFile } = require("./settings");

function checkParameter(name) {
    for (var x in args) {
        if (args[x] == name) {
            return true;
        }
    }

    return false;
}

const startup = readKeyFromFile("general.conf.json", "auto-start");
var args = process.argv;
if (checkParameter("--nowindowinit")) {
    if (startup == false) {
        app.exit();
    }    
}

app.setLoginItemSettings({
    args: ["--nowindowinit"],
    openAtLogin: startup
})