const { ipcRenderer } = require("electron");
const settings = require("../settings");

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


class tab {
    constructor(title) {
        tabs.push(this);
        this.tab_button = document.createElement("div");
        this.title = document.createElement("a");
        this.tab_button.appendChild(this.title);
        this.container = document.createElement("div");
        this.container.classList.add("content");
        this.tab_button.classList.add("tab");
        this.title.innerHTML = title;
        this.onfocus = () => { };

        document.getElementById("container").appendChild(this.container);
        document.getElementById("tab_bar").appendChild(this.tab_button);
    }

    focus() {
        //hide other tabs
        for (var x in tabs) {
            tabs[x].container.style.display = "none";
            tabs[x].tab_button.style.backgroundColor = "transparent";
            tabs[x].tab_button.style.borderBottom = "none";
            tabs[x].tab_button.style.height = "40px";
        }

        //show this tab
        this.container.style.display = "block";
        this.tab_button.style.backgroundColor = "rgba(255,255,255, 0.150)";
        this.tab_button.style.borderBottom = "2px solid rgb(0, 225, 255)";
        this.tab_button.style.height = "38px";
        this.onfocus();
    }
}

//declare tabs
var welcome_tab = new tab("Welcome");
var search_engine_tab = new tab("Search engine");
var final_tab = new tab("Finish");

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
            final_tab.focus();
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
        search_engine_tab.focus();
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