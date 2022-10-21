const { ipcRenderer } = require("electron");
const settings = require("../main-js/settings");

//loading config
var config = null;

var data = settings.readData("general.conf.json");
if (data == "{}") {
    console.error("Configuration error");
    window.alert("Configuration error, please restart the browser / delete general config file");
}
else {
    config = JSON.parse(data);
}

function saveConf() {
    settings.saveData("general.conf.json", JSON.stringify(config));
}

var tabs = [];

const search_engines = ipcRenderer.sendSync("searchEngines");

//declare tabs
var welcome_tab = new tab("Welcome");
var search_engine_tab = new tab("Search engine");
var extras_tab = new tab("Extras");
var final_tab = new tab("Finish");

welcome_tab.disableFocusButton();
search_engine_tab.disableFocusButton();
final_tab.disableFocusButton();
extras_tab.disableFocusButton();

//setup welcome screen
function setupWelcome() {
    var tab = welcome_tab;
    var title = document.createElement("h1");
    title.innerHTML = "Welcome to Carbon!";
    title.style.opacity = "0";
    title.style.marginTop = "20px";

    var version_text = document.createElement("h3");
    version_text.innerHTML = "Version " + getVersion();
    version_text.style.opacity = "0";
    version_text.style.marginTop = "50px";

    var continue_button = document.createElement("button");
    continue_button.innerHTML = "Continue";
    continue_button.classList.add("continue_btn");
    continue_button.style.opacity = "0";

    continue_button.onclick = () => {
        search_engine_tab.focus();
    }

    tab.container.appendChild(continue_button);


    tab.container.appendChild(title);
    tab.container.appendChild(version_text);
    setTimeout(() => {
        title.style.opacity = "1";
        title.style.marginTop = "0px";
        setTimeout(() => {
            version_text.style.opacity = "1";
            version_text.style.marginTop = "0px";
            continue_button.style.opacity = "1";
        }, 1000);
    }, 100);

    tab.focus();
}

setupWelcome();


//setup search engine screen
function setupEngine() {
    var tab = search_engine_tab;
    var title = document.createElement("h1");
    title.innerHTML = "Select search engine";
    title.style.opacity = "0";
    title.style.marginTop = "20px";

    var back_button = document.createElement("button");
    back_button.innerHTML = "Back";
    back_button.classList.add("back_btn");
    back_button.style.opacity = "0";

    back_button.onclick = () => {
        welcome_tab.focus();
    }

    tab.container.appendChild(back_button);

    var selector = document.createElement("div");
    selector.classList.add("selector");
    selector.style.opacity = "0";
    selector.style.marginTop = "20px";

    tab.container.appendChild(selector);

    function addSelect(engine) {
        var select = document.createElement("div");
        select.innerHTML = engine;
        selector.appendChild(select);
        select.onclick = () => {
            config["searchEngine"] = engine;
            saveConf();
            extras_tab.focus();
        }
    }

    for (var x in search_engines) {
        addSelect(search_engines[x]);
    }


    tab.container.appendChild(title);
    tab.onfocus = () => {
        setTimeout(() => {
            title.style.opacity = "1";
            title.style.marginTop = "0px";
            setTimeout(() => {
                selector.style.opacity = "1";
                selector.style.marginTop = "0px";
            }, 500);

            setTimeout(() => {
                back_button.style.opacity = "1";
            }, 1000);
        }, 100);
    }
}

setupEngine();

//setup extras page
function setupExtras() {
    var tab = extras_tab;
    var title = document.createElement("h1");
    title.innerHTML = "Extra features";
    title.style.opacity = "0";
    title.style.marginTop = "20px";

    var continue_button = document.createElement("button");
    continue_button.innerHTML = "Continue";
    continue_button.classList.add("continue_btn");
    continue_button.style.opacity = "0";

    var back_button = document.createElement("button");
    back_button.innerHTML = "Back";
    back_button.classList.add("back_btn");
    back_button.style.opacity = "0";

    back_button.onclick = () => {
        search_engine_tab.focus();
    }

    continue_button.onclick = () => {
        final_tab.focus();
    }

    tab.container.appendChild(continue_button);
    tab.container.appendChild(back_button);

    var switch_container = document.createElement("div")
    var adblock_switch = new switchbox();
    adblock_switch.onchange = () => {
        config["adblock"] = adblock_switch.state;
        saveConf();
    }

    switch_container.style.lineHeight = "40px";

    var adblock_text = document.createElement("a");
    adblock_text.style.marginLeft = "-50px";
    adblock_text.innerHTML = "AD block";
    var adblock_line = document.createElement("div");
    adblock_line.classList.add("switch_line");
    adblock_line.appendChild(adblock_text);
    adblock_line.appendChild(adblock_switch.mainElement);
    switch_container.appendChild(adblock_line);
    adblock_switch.mainElement.style.marginTop = "-40px";
    adblock_switch.mainElement.style.left = "50px";

    switch_container.style.position = "absolute";
    switch_container.style.top = "10%";
    switch_container.style.width = "80%";
    switch_container.style.left = "10%";


    tab.container.appendChild(title);
    switch_container.style.opacity = 0;
    tab.container.appendChild(switch_container);
    tab.onfocus = () => {
        setTimeout(() => {
            title.style.opacity = "1";
            title.style.marginTop = "0px";
            back_button.style.opacity = 1;
            continue_button.style.opacity = 1;
            switch_container.style.opacity = 1;
        }, 100);
    }
}

setupExtras();

//setup final page

function setupFinal() {
    var tab = final_tab;
    var title = document.createElement("h1");
    title.innerHTML = "Everything is set up!";
    title.style.opacity = "0";
    title.style.marginTop = "20px";

    var note = document.createElement("h3");
    note.innerHTML = "Thank you for using Carbon!";
    note.style.opacity = "0";
    note.style.marginTop = "50px";

    var back_button = document.createElement("button");
    back_button.innerHTML = "Back";
    back_button.classList.add("back_btn");
    back_button.style.opacity = "0";

    back_button.onclick = () => {
        extras_tab.focus();
    }

    tab.container.appendChild(back_button);

    var finish_button = document.createElement("button");
    finish_button.innerHTML = "Finish";
    finish_button.classList.add("continue_btn");
    finish_button.style.opacity = "0";
    tab.container.appendChild(finish_button);

    finish_button.onclick = closewin;


    tab.container.appendChild(title);
    tab.container.appendChild(note);
    tab.onfocus = () => {
        setTimeout(() => {
            title.style.opacity = "1";
            title.style.marginTop = "0px";
            setTimeout(() => {
                note.style.opacity = "1";
                note.style.marginTop = "0px";
                back_button.style.opacity = "1";
                finish_button.style.opacity = "1";
            }, 1000);
        }, 100);
    }
}

setupFinal();

if (process.platform == "win32" || process.platform == "darwin") {
    document.getElementById("window_controls").style.display = "none";
}

if(process.platform == "darwin") {
    document.getElementById("toolbar").style.left = "80px";
}