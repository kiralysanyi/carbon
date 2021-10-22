const { ipcRenderer } = require("electron");

//ipc crap
var afterinit = false;

var tabs = {};
var focused_tab = null;

const back_button = document.getElementById("back_button");
const forward_button = document.getElementById("forward_button");
var isBackButtonShown = false;
var isForwardButtonShown = false;


//hide back button
function hideBack() {
    isBackButtonShown = false;
    back_button.style.opacity = 0;
    setTimeout(() => {
        back_button.style.display = "none";
        if (isForwardButtonShown) {
            urlbar.style.width = "width: calc(100% - 160px);"
            urlbar.style.left = "150px"
        }
        else {
            urlbar.style.width = "width: calc(100% - 110px);"
            urlbar.style.left = "100px"
        }
    }, 200);
}

//hide forward button
function hideForward() {
    isBackForwardShown = false;
    forward_button.style.opacity = 0;
    setTimeout(() => {
        forward_button.style.display = "none";
        if (isBackButtonShown) {
            urlbar.style.width = "width: calc(100% - 160px);"
            urlbar.style.left = "150px"
        }
        else {
            urlbar.style.width = "width: calc(100% - 110px);"
            urlbar.style.left = "100px"
        }
    }, 200);
}

//show back button
function showBack() {
    isBackButtonShown = true;
    back_button.style.display = "block";
    setTimeout(() => {
        back_button.style.opacity = 1;
        if (isForwardButtonShown) {
            urlbar.style.width = "width: calc(100% - 210px);"
            urlbar.style.left = "200px"
        }
        else {
            urlbar.style.width = "width: calc(100% - 160px);"
            urlbar.style.left = "150px"
        }
    }, 200);
}

//show forward button
function showForward() {
    isForwardButtonShown = true;
    forward_button.style.display = "block";
    setTimeout(() => {
        forward_button.style.opacity = 1;
        if (isBackButtonShown) {
            urlbar.style.width = "width: calc(100% - 210px);"
            urlbar.style.left = "200px"
        }
        else {
            urlbar.style.width = "width: calc(100% - 160px);"
            urlbar.style.left = "150px"
        }
    }, 200);
}

//reset control buttons
function resetControls() {
    isForwardButtonShown = false;
    isBackButtonShown = false;
    forward_button.style.display = "none";
    back_button.style.display = "none";
    forward_button.style.opacity = 0;
    back_button.style.opacity = 0;
    urlbar.style.width = "width: calc(100% - 110px);"
    urlbar.style.left = "100px"
}

function resizeAll() {
    for (var x in tabs) {
        tabs[x].resize();
    }
}

function positionAll(data) {
    for (var x in tabs) {
        tabs[x].position(data);
    }
}

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
    constructor(page) {
        if (afterinit == true) {
            urlbar.style.display = "block";
        }
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
                document.getElementById("urlbar").value = this.getUrl();

                if (this.canGoBack() == true) {
                    showBack();
                } else {
                    hideBack();
                }

                if (this.canGoForward() == true) {
                    showForward()
                }
                else {
                    hideForward();
                }
            }
        }

        //connect to tabhost
        console.log("Initializing tab: ", this.id)
        ipcRenderer.sendSync("newTab", { uuid: this.id })
        //event listeners
        ipcRenderer.on(this.id, (e, data) => {
            const type = data.type;
            const url = data.url;
            const favicons = data.favicons;

            if (type == "did-start-loading") {
                loadstart();
            }

            if (type == "did-stop-loading") {
                loadend();
            }

            if (type == "page-title-updated") {
                this.title.innerHTML = data.title;
            }

            if (type == "page-favicon-updated") {
                this.favicon.src = favicons[favicons.length - 1];
            }

            if (type == "new-window") {
                if (url) {
                    new tab(url);
                }
                else {
                    console.error("No url provided by tabhost");
                }
            }
        })



        //end
        if (page) {
            this.navigate(page);
        }
        else {
            this.navigate(startpage);
        }
        this.focus();
        onTabUpdate();
        ipcRenderer.sendSync("addListeners")
    }

    navigate(url) {
        //load url
        ipcRenderer.sendSync("navigate", { uuid: this.id, url: url });
    }

    getUrl() {
        return ipcRenderer.sendSync("getUrl", this.id);
    }

    canGoBack() {
        return ipcRenderer.sendSync("canGoBack", this.id);
    }

    canGoForward() {
        return ipcRenderer.sendSync("canGoForward", this.id);
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
        ipcRenderer.sendSync("focusTab", this.id)
        document.getElementById("urlbar").value = this.getUrl();

        if (afterinit == true) {
            if (this.canGoBack() == true) {
                showBack();
            }
            else {
                hideBack();
            }

            if (this.canGoForward() == true) {
                showForward();
            }
            else {
                hideForward();
            }
        }
    }

    hide() {
        //hide tab
        this.isFocused = false;
        this.tab_button.style.backgroundColor = "transparent";
    }

    back() {
        //goback
        ipcRenderer.sendSync("goBack", this.id)
    }

    reload() {
        //reload
        ipcRenderer.sendSync("reload", this.id);
    }

    forward() {
        //goforward
        ipcRenderer.sendSync("goForward", this.id)
    }

    destroy() {
        //close tab
        ipcRenderer.sendSync("removeTab", this.id);
        this.tab_button.remove();
        delete tabs[this.id];
        if (focused_tab == this.id) {
            var highest = tabs[Object.keys(tabs).sort().pop()];
            if (highest) {
                highest.focus();
            }
            else {
                focused_tab = null;
                console.log("All tabs closed")
                document.getElementById("urlbar").value = "";
                urlbar.style.display = "none";
                resetControls();
            }
        }
    }

    devtools() {
        ipcRenderer.sendSync("openDevTools", this.id)
    }
}

function newTab() {
    new tab();
}

function goBack() {
    getTab(focused_tab).back();
}

function goForward() {
    getTab(focused_tab).forward();
}

function reload() {
    getTab(focused_tab).reload();
}

function openDevTools() {
    getTab(focused_tab).devtools();
}

function navigate(url) {
    getTab(focused_tab).navigate(url);
}