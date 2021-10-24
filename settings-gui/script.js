const { ipcRenderer } = require("electron");
const settings = require("../settings");

//loading config
var config = null;

var data = settings.readData("general.conf.json");
if (data == false) {
    console.error("Configuration error");
    window.alert("Configuration error, please restart the browser");
}
else {
    config = JSON.parse(data);
}

function saveConf() {
    settings.saveData("general.conf.json", JSON.stringify(config));
}

class switchbox {
    constructor() {
        this.onchange = null;
        this.mainElement = document.createElement("div");
        this.mainElement.classList.add("switch");
        this.thumb = document.createElement("div");
        this.thumb.classList.add("thumb");
        this.mainElement.appendChild(this.thumb);
        this.state = false;
        this.mainElement.onclick = () => {
            this.toggleState();
        };
    }

    toggleState() {
        if (this.state == true) {
            this.changeState(false);
        }
        else {
            this.changeState(true);
        }

        if (this.onchange) {
            this.onchange();
        }
    }

    changeState(newState) {
        if (newState != true && newState != false) {
            console.error("Invalid state:", newState);
            return;
        }

        if (newState == true) {
            this.thumb.style.left = "45px";
        }
        else {
            this.thumb.style.left = "5px";
        }

        this.state = newState;
    }
}

function showLoader() {
    document.getElementById("loader").style.display = "block";
    document.getElementById("window_controls").style.pointerEvents = "none";
}

function hideLoader() {
    setTimeout(() => {
        document.getElementById("loader").style.display = "none";
        document.getElementById("window_controls").style.pointerEvents = "all";            
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

//setting up head row
var settings_head = document.createElement("tr");
settings_table.appendChild(settings_head);
settings_head.innerHTML = "<th>Option</th><th>Switch</th>"

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

//setting up search engine selector
var search_select = document.createElement("select");
var engines = ipcRenderer.sendSync("searchEngines");
for (var x in engines) {
    var option_element = document.createElement("option");
    option_element.innerHTML = engines[x];
    option_element.value = engines[x];
    search_select.appendChild(option_element);
}
search_td2.appendChild(search_select);
search_select.onchange = () => {
    config.searchEngine = search_select.value;
    saveConf();
}

search_select.value = config.searchEngine;

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

                    var selector = document.createElement("select");
                    var option1 = document.createElement("option");
                    var option2 = document.createElement("option");
                    option1.innerHTML = "Denied";
                    option1.value = false;
                    option2.innerHTML = "Allowed";
                    option2.value = true;
                    selector.appendChild(option1);
                    selector.appendChild(option2);

                    selector.value = permissions[host][perm];

                    selector.onchange = () => {
                        var data = selector.value;
                        if (data == "true") {
                            data = true;
                        }
                        else {
                            data = false;
                        }
                        permissions[host][perm] = data;
                        console.log(permissions, host, perm);
                        settings.saveData("permissions.conf.json", JSON.stringify(permissions));
                    }

                    sub_data.appendChild(selector);
                })()
            }
        }
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
permission_tab.container.appendChild(refresh_button);

permission_tab.container.appendChild(permission_container);

refresh();

//setting up about page

var aboutpage = new tab("About");
aboutpage.container.style.textAlign = "center";
var about_title = document.createElement("h1");
aboutpage.container.appendChild(about_title);
about_title.innerHTML = "Sanyicraft Carbon";
var version_subtitle = document.createElement("h3");
version_subtitle.innerHTML = "Version: " + getVersion();
aboutpage.container.appendChild(version_subtitle);


general_tab.focus();