const { ipcRenderer } = require("electron");
const settings = require("../main-js/settings");

//loading config
var config = null;
var experimental_config = null;


var data = settings.readData("general.conf.json");
if (data == false) {
    console.error("Configuration error");
    window.alert("Configuration error, please restart the browser");
}
else {
    config = JSON.parse(data);
}

data = settings.readData("experimental.conf.json");

if (data == false) {
    console.error("Configuration error");
    window.alert("Configuration error, please restart the browser");
}
else {
    experimental_config = JSON.parse(data);
}

function saveConf() {
    settings.saveData("general.conf.json", JSON.stringify(config));
    settings.saveData("experimental.conf.json", JSON.stringify(experimental_config));
}

function checkStartup() {
    return ipcRenderer.sendSync("isAutoStarting");
}

function updateStartupConfig(bool) {
    ipcRenderer.send("updateAutoStartConfig", bool);
}

document.getElementById("adblock_switch").setAttribute("value", config["adblock"]);
document.getElementById("autoupdate_switch").setAttribute("value", config["auto-update"]);
document.getElementById("search_select").value = config["searchEngine"];
document.getElementById("immersive_switch").setAttribute("value", experimental_config["immersive_interface"]);
document.getElementById("startup_switch").setAttribute("value", checkStartup());

//setting up permissions page

const permission_container = document.getElementById("permission_container")

function refresh() {
    permission_container.innerHTML = "";
    var data = settings.readData("permissions.conf.json")
    if (data == false) {
        console.log("No permission config file found");
        return;
    }
    else {
        var permissions = JSON.parse(data);
        console.log("Loaded permission config");
        for (var x in permissions) {
            var index = document.createElement("div");
            index.classList.add("menuitem");
            index.innerHTML = "<a>" + x + "</a>";
            permission_container.appendChild(index);
            for (var y in permissions[x]) {
                (() => {
                    var host = x;
                    var perm = y;
                    var sub_data = document.createElement("div");
                    sub_data.classList.add("submenuitem");
                    sub_data.innerHTML = "<a>" + y + "<a>"
                    permission_container.appendChild(sub_data);

                    var selector = new select();
                    selector.mainObj.style.marginLeft = "200px"
                    selector.addOption("Allowed", true);
                    selector.addOption("Denied", false);
                    selector.setValue(permissions[host][perm]);

                    selector.onchange = () => {
                        var data = selector.value;
                        permissions[host][perm] = data;
                        console.log(permissions, host, perm);
                        settings.saveData("permissions.conf.json", JSON.stringify(permissions));
                    }

                    sub_data.appendChild(selector.mainObj);
                })()
            }
        }
        permission_container.appendChild(document.createElement("br"))
        permission_container.appendChild(document.createElement("br"))
        permission_container.appendChild(document.createElement("br"))
        permission_container.appendChild(document.createElement("br"))
    }
}



refresh();

document.getElementById("refresh_btn").onclick = () => {
    refresh();
}


const restartButton = document.createElement("button");
restartButton.id = "restart_btn";
document.body.appendChild(restartButton);
restartButton.innerHTML = "Restart browser"
restartButton.onclick = () => {
    restartBrowser();
}

function restartBrowser() {
    ipcRenderer.send("restart");
}

dasUI.tabs.initMainObject("tabs");

dasUI.switchbox.initSwitchBoxes();

const adblock_switch = document.getElementById("adblock_switch");
const autoupdate_switch = document.getElementById("autoupdate_switch");
const search_select = document.getElementById("search_select");
const immersive_switch = document.getElementById("immersive_switch");
immersive_switch.onchange = () => {
    experimental_config["immersive_interface"] = immersive_switch.checked;
    saveConf();
}

adblock_switch.onchange = () => {
    config["adblock"] = adblock_switch.checked;
    if (adblock_switch.checked == true) {
        console.log("Enabling adblock")
        ipcRenderer.sendSync("enableAdblock");
    } else {
        console.log("Disabling adblock")
        ipcRenderer.sendSync("disableAdblock");
    }
    saveConf();
}

autoupdate_switch.onchange = () => {
    config["auto-update"] = autoupdate_switch.checked;
    saveConf();
}

document.getElementById("startup_switch").onchange = () => {
    updateStartupConfig(document.getElementById("startup_switch").checked);
}

search_select.onchange = () => {
    config["searchEngine"] = search_select.value;
    saveConf();
}

//about page

document.getElementById("version_display").innerHTML = "Carbon: " + ipcRenderer.sendSync("getVersion");
document.getElementById("node_display").innerHTML = "NodeJS: " + process.versions.node;
document.getElementById("electron_display").innerHTML = "Electron: " + process.versions.electron;
document.getElementById("chromium_display").innerHTML = "Chromium: " + process.versions.chrome;

//update

const state_display = document.getElementById("update_state_display");
state_display.innerHTML = "No updates found"
const check_button = document.getElementById("checkUpdate");
const update_button = document.getElementById("downloadUpdate");

check_button.onclick = () => {
    checkUpdate();
}

update_button.style.display = "none";
update_button.onclick = () => {
    startUpdate();
}

var update_displayed = false;

ipcRenderer.on("show-update", () => {
    if (update_displayed == true) {
        return;
    }

    update_displayed = true;
    state_display.innerHTML = "Update available";
    check_button.style.display = "none";
    update_button.style.display = "block"
})

ipcRenderer.on("hide-update", () => {
    update_button.style.display = "none";
})

function checkUpdate() {
    ipcRenderer.send("checkUpdate");
}

function startUpdate() {
    ipcRenderer.send("start-update");
}


ipcRenderer.on("update-state", (e, state) => {
    state_display.innerHTML = state;
})

const channel_select = document.getElementById("channel_select");
channel_select.value = config["update-channel"]

channel_select.onchange = () => {
    config["update-channel"] = channel_select.value;
    saveConf();
}