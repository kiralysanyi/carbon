const { ipcRenderer } = require("electron");
const remote = require("electron").remote;

const win = remote.getCurrentWindow();
const BrowserView = remote.BrowserView;


//creating empty browserview
const blankview = new BrowserView();
win.setBrowserView(blankview)
blankview.setBounds({ width: 0, height: 0, x: 0, y: 0 });
blankview.webContents.loadFile("./app/pages/blank.html")

var tabs = {};
var focused_tab = null;
const USERAGENT = "Mozilla/5.0 (X11; Fedora; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.63 Safari/537.36";


const container = document.getElementById("web_container")
const tab_bar = document.getElementById("tab_bar");

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function onTabUpdate() {
    if (Object.keys(tabs).length > 2) {
        tab_bar.scrollLeft = tab_bar.scrollWidth;
    }
}

var startpage = "https://google.com";

function getTab(id) {
    return tabs[id];
}

class tab {
    constructor() {
        this.id = uuidv4();
        tabs[this.id] = this;
        this.isFocused = false;

        this.tab_button = document.createElement("div");
        this.title = document.createElement("a");
        this.favicon = document.createElement("img");
        this.close_btn = document.createElement("div");
        this.close_btn.classList.add("close");
        this.tab_button.appendChild(this.close_btn);

        this.close_btn.innerHTML = "<i class='lni lni-close'></i>"

        this.tab_button.appendChild(this.title);
        this.tab_button.appendChild(this.favicon);

        tab_bar.appendChild(this.tab_button);

        this.tab_button.onclick = (e) => {
            this.focus();
        }

        this.close_btn.onclick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.destroy();
        }

        this.tab_button.onmousedown = (e) => {
            if (e.button == 1) {
                this.destroy();
                return;
            }
        }

        this.loader = document.createElement("div");
        this.loader.classList.add("bottom_line_loader");
        this.tab_button.appendChild(this.loader);
        this.tab_button.classList.add("tab");

        var loadstart = () => {
            this.loader.style.display = "block";
        }

        var loadend = () => {
            this.loader.style.display = "none";
            if (focused_tab == this.id) {
                document.getElementById("urlbar").value = this.view.webContents.getURL();
            }
        }

        //connect to tabhost
        console.log("Initializing tab: ", this.id)
        this.view = new BrowserView();
        //event listeners

        this.view.webContents.on("did-start-loading", loadstart);
        this.view.webContents.on("did-stop-loading", loadend);
        this.view.webContents.on("page-title-updated", () => {
            this.title.innerHTML = this.view.webContents.getTitle();
        })

        this.view.webContents.on("page-favicon-updated", (e, favicons) => {
            this.favicon.src = favicons[favicons.length - 1]
        })

        //end
        win.addBrowserView(this.view);
        var webview = this.view;
        this.view.setBounds({ width: window.outerWidth, height: window.outerHeight - 90, x: 0, y: 90 });
        win.on("resize", () => {
            webview.setBounds({ width: window.outerWidth, height: window.outerHeight - 90, x: 0, y: 90 });
        })

        setInterval(() => {
            webview.setBounds({ width: window.outerWidth, height: window.outerHeight - 90, x: 0, y: 90 });
        }, 500);

        this.view.webContents.loadURL(startpage);
        this.focus();
        onTabUpdate();
    }

    navigate(url) {
        //load url
    }

    focus() {
        //focus tab
        focused_tab = this.id;
        for (var x in tabs) {
            if (x != this.id) {
                tabs[x].hide();
            }
        }
        this.tab_button.style.backgroundColor = "rgba(255,255,255, 0.150)";
        this.isFocused = true;
        win.setTopBrowserView(this.view);
        document.getElementById("urlbar").value = this.view.webContents.getURL();
    }

    hide() {
        //hide tab
        this.isFocused = false;
        this.tab_button.style.backgroundColor = "transparent";
    }

    back() {
        //goback
        this.view.webContents.goBack();
    }

    forward() {
        //goforward
        this.view.webContents.goForward();
    }

    destroy() {
        //close tab
        win.removeBrowserView(this.view);
        this.tab_button.remove();
        delete tabs[this.id];
    }
}

function newTab() {
    new tab();
}

function goBack() {
    getTab(focused_tab).back();
}