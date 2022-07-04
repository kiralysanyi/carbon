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

function showLoader() {
    document.getElementById("loader").style.display = "block";
}

function hideLoader() {
    setTimeout(() => {
        document.getElementById("loader").style.display = "none";
    }, 1000);
}

var general_tab = new tab("General");
var permission_tab = new tab("Permissions");

//setting up general page
var general_title = document.createElement("h1");
general_title.innerHTML = "General"
general_tab.container.appendChild(general_title);

var settings_table = document.createElement("table");
general_tab.container.appendChild(settings_table);

//setting up row1
var settings_row1 = document.createElement("tr");
settings_table.appendChild(settings_row1);

//adding adblock to row1
var adblock_td1 = document.createElement("td");
var adblock_td2 = document.createElement("td");
var adblock_switch = new switchbox();
adblock_td2.appendChild(adblock_switch.mainElement);
settings_row1.appendChild(adblock_td1);
settings_row1.appendChild(adblock_td2);

var adblock_title = document.createElement("a");
adblock_switch.onchange = () => {
    showLoader();
    if (adblock_switch.state == true) {
        ipcRenderer.sendSync("enableAdblock");
    }
    else {
        ipcRenderer.sendSync("disableAdblock");
    }
    config.adblock = adblock_switch.state;
    saveConf();
    hideLoader();
}

adblock_title.innerHTML = "Adblock"
adblock_td1.appendChild(adblock_title);

if (config.adblock == true) {
    adblock_switch.changeState(true);
}
else {
    adblock_switch.changeState(false);
}

//setting up row2
var settings_row2 = document.createElement("tr");
settings_table.appendChild(settings_row2);
var search_td1 = document.createElement("td");
var search_td2 = document.createElement("td");
settings_row2.appendChild(search_td1);
settings_row2.appendChild(search_td2);
search_td1.innerHTML = "<a>Search engine</a>"

settings_row2.style.height = "40px";

//setting up search engine selector
var search_select = new select();
search_select.mainObj.style.width = "100%";
var engines = ipcRenderer.sendSync("searchEngines");
for (var x in engines) {
    search_select.addOption(engines[x], engines[x]);
}
search_td2.appendChild(search_select.mainObj);
search_select.onchange = () => {
    config.searchEngine = search_select.value;
    saveConf();
}

search_select.setValue(config.searchEngine);
search_select.mainObj.style.marginTop = "0px";

//setting up row3
var settings_row3 = document.createElement("tr");
settings_table.appendChild(settings_row3);
var home_td1 = document.createElement("td");
var home_td2 = document.createElement("td");
home_td1.innerHTML = "<a>Homepage</a>";

var home_reset = document.createElement("button");
home_reset.innerHTML = "Reset";
home_reset.style.height = "40px";

var home_input = document.createElement("input");
home_input.type = "text";
home_input.style.width = "70%";
home_reset.style.width = "20%";

home_reset.onclick = () => {
    home_input.value = "default";
    config.homePage = "default";
    saveConf();
}

home_input.onchange = () => {
    config.homePage = home_input.value;
    saveConf();
}

home_td2.appendChild(home_input);
home_td2.appendChild(home_reset);

home_input.value = config.homePage;


settings_row3.appendChild(home_td1);
settings_row3.appendChild(home_td2);


//setting up permissions page

function refresh() {
    permission_container.innerHTML = "";
    showLoader();
    var data = settings.readData("permissions.conf.json")
    if (data == false) {
        console.log("No permission config file found");
        hideLoader();
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
    hideLoader();
}

var permissions_title = document.createElement("h1");
var permissions_subtitle = document.createElement("a");
permissions_title.innerHTML = "Permission manager";
permissions_subtitle.innerHTML = "You may need to reload the pages for apply changes";

permission_tab.container.appendChild(permissions_title);
permission_tab.container.appendChild(permissions_subtitle);

var permission_container = document.createElement("div");
permission_container.id = "pcontainer"
var refresh_button = document.createElement("button");
refresh_button.innerHTML = "Refresh";
refresh_button.id = "refresh_button";
refresh_button.onclick = refresh;
permission_container.appendChild(refresh_button);

permission_tab.container.appendChild(permission_container);


refresh();

//setting up about page

var aboutpage = new tab("About");
aboutpage.container.style.textAlign = "center";
var about_title = document.createElement("h1");
aboutpage.container.appendChild(about_title);
about_title.innerHTML = "Sanyicraft Carbon";
var version_subtitle = document.createElement("h3");
version_subtitle.innerHTML = "Carbon: " + getVersion();
version_subtitle.innerHTML += "<br>Electron: " + process.versions.electron;
version_subtitle.innerHTML += "<br>Chrome: " + process.versions.chrome;
version_subtitle.innerHTML += "<br>Node: " + process.versions.node;
var checkForUpdates_button = document.createElement("button")
aboutpage.container.appendChild(checkForUpdates_button)
checkForUpdates_button.innerHTML = "Check for updates"
checkForUpdates_button.addEventListener("click", () => {
    ipcRenderer.send("checkUpdate")
})
var update_button = document.createElement("button");
update_button.innerHTML = "Update";
aboutpage.container.appendChild(update_button);
update_button.style.display = "none";
ipcRenderer.on("show-update", () => {
    update_state_display.innerHTML = "Update available";
    update_button.style.display = "block";
})

update_button.addEventListener("click", () => {
    ipcRenderer.send("start-update")
})

var update_channel_select = new select();
update_channel_select.mainObj.style.marginLeft = "auto";
update_channel_select.mainObj.style.marginRight = "auto";
update_channel_select.addOption("stable", "stable");
update_channel_select.addOption("beta", "beta");

update_channel_select.setValue(config["update-channel"])

update_channel_select.onchange = () => {
    config["update-channel"] = update_channel_select.value;
    saveConf();
    update_state_display.innerHTML = "You need to restart the browser to apply changes."
}

var update_state_display = document.createElement("h3");
update_state_display.innerHTML = "No updates found";
ipcRenderer.on("update-state", (e, state) => {
    console.log(state)
    update_state_display.innerHTML = state
})

aboutpage.container.appendChild(version_subtitle);
aboutpage.container.appendChild(update_state_display);
aboutpage.container.appendChild(update_channel_select.mainObj);
update_channel_select.mainObj.style.marginTop = "20px"

var spacer = document.createElement("div")
spacer.classList.add("spacer")
aboutpage.container.appendChild(spacer)

update_channel_select.mainObj.style.marginTop = "50px"


//setting up experimental page

var experimental_page = new tab("Experimental");
var experimental_title = document.createElement("h1");
experimental_title.innerHTML = "Experimental settings";
experimental_page.container.appendChild(experimental_title);

var exp_settings_table = document.createElement("table");
experimental_page.container.appendChild(exp_settings_table);

//setting up row 1
var immersive_row = document.createElement("tr");
immersive_row.innerHTML = "<td><a>Immersive interface (browser restart needed)</a></td>";

var immersive_td_2 = document.createElement("td");
immersive_row.appendChild(immersive_td_2);
var immersive_switch = new switchbox();
immersive_td_2.appendChild(immersive_switch.mainElement);

immersive_switch.changeState(experimental_config.immersive_interface);
immersive_switch.onchange = () => {
    experimental_config.immersive_interface = immersive_switch.state;
    saveConf();
}

//setting up row 2
var autoupdate_row = document.createElement("tr");
autoupdate_row.innerHTML = "<td><a>Enable auto updates (browser restart needed)</a></td>";

var autoupdate_td = document.createElement("td");
autoupdate_row.appendChild(autoupdate_td);
var autoupdate_switch = new switchbox();
autoupdate_td.appendChild(autoupdate_switch.mainElement);
console.log(config["auto-update"])
autoupdate_switch.changeState(config["auto-update"]);
autoupdate_switch.onchange = () => {
    config["auto-update"] = autoupdate_switch.state;
    saveConf();
}

exp_settings_table.appendChild(immersive_row);
settings_table.appendChild(autoupdate_row);

general_tab.focus();