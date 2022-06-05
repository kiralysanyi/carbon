const { ipcRenderer } = require("electron");
const settings = require("../settings");

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
        if (isForwardButtonShown == true) {
            urlbar.style.width = "calc(100% - 260px)"
            urlbar.style.left = "150px"
        }
        else {
            urlbar.style.width = "calc(100% - 210px)"
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
        if (isBackButtonShown == true) {
            urlbar.style.width = "calc(100% - 260px)"
            urlbar.style.left = "150px"
        }
        else {
            urlbar.style.width = "calc(100% - 210px)"
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
            urlbar.style.width = "calc(100% - 310px)"
            urlbar.style.left = "200px"
        }
        else {
            urlbar.style.width = "calc(100% - 260px)"
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
            urlbar.style.width = "calc(100% - 310px)"
            urlbar.style.left = "200px"
        }
        else {
            urlbar.style.width = "calc(100% - 210px)"
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
    setTimeout(() => {
        if (Object.keys(tabs).length > 5) {
            tab_bar.style.scrollBehavior = "smooth";
            setTimeout(() => {
                tab_bar.scrollLeft = tab_bar.scrollWidth;
                setTimeout(() => {
                    tab_bar.style.scrollBehavior = "auto";
                }, 200);
            }, 50);
        }
    }, 200);
}

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
        this.error = false;

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

        this.mute_button = document.createElement("div");
        this.mute_button.classList.add("mute");
        this.loader = document.createElement("div");
        this.loader.classList.add("bottom_line_loader");
        this.tab_button.appendChild(this.loader);
        this.tab_button.classList.add("tab");
        this.tab_button.appendChild(this.mute_button);

        this.mute_button.onclick = (e) => {
            e.stopPropagation();
            this.mute();
        }

        this.mute_button.innerHTML = '<i class="lni lni-volume-medium"></i>'

        this.mute_button.style.display = "none";

        var loadstart = () => {
            this.loader.style.display = "block";
        }

        var loadend = (utype) => {
            this.loader.style.display = "none";
            if (focused_tab == this.id) {
                if (document.getElementById("urlbar") != document.activeElement && utype != "home") {
                    var url = this.getUrl();
                    if (url != "no_change") {
                        document.getElementById("urlbar").value = url;
                    }            
                }

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
        ipcRenderer.send("newTab", { uuid: this.id })
        //event listeners
        ipcRenderer.on(this.id, (e, data) => {
            const type = data.type;
            const url = data.url;
            const favicons = data.favicons;

            if (type == "did-navigate") {
                this.favicon.style.display = "none";
                this.title.style.left = "10px";
                this.tab_button.style.color = "white"
                this.customcolor = false;
                if (this.isFocused == true) {
                    console.log("Setting color")
                    this.tab_button.style.backgroundColor = "rgba(255,255,255, 0.150)";
                } else {
                    this.tab_button.style.backgroundColor = "transparent";
                }
            }

            if (type == "did-start-loading") {
                showCurrentTab();
                this.error = false;
                hideErrorPage();
                loadstart();
            }

            if (type == "did-stop-loading") {
                loadend(data.urltype);
            }

            if (type == "did-fail-load") {
                loadend();
                this.error = {
                    code: data.code,
                    description: data.description
                };

                if (this.id == focused_tab) {
                    hideCurrentTab();
                    this.title.innerHTML = "Error!";
                    const errorPageElement = showErrorPage(data.code, data.description);
                    const reloadButton = document.createElement("button");
                    reloadButton.innerHTML = "Retry";
                    errorPageElement.appendChild(reloadButton);
                    reloadButton.onclick = () => {
                        this.reload();
                    }
                }
            }

            if (type == "page-title-updated") {
                this.title.innerHTML = data.title;
                if(focused_tab == this.id) {
                    document.title = data.title + " - Carbon";
                }
            }

            if (type == "page-favicon-updated") {
                this.title.style.left = "40px";
                this.favicon.style.display = "block";
                this.favicon.src = favicons[favicons.length - 1];
            }

            if (type == "media-started-playing") {
                this.mute_button.style.display = "block";
                this.tab_button.style.height = "38px";
                this.tab_button.style.borderBottom = "solid 2px red";
            }

            if (type == "media-paused") {
                this.mute_button.style.display = "none";
                this.tab_button.style.height = "40px";
                this.tab_button.style.borderBottom = "none";
            }

            if (type == "new-window") {
                if (url) {
                    new tab(url);
                }
                else {
                    console.error("No url provided by tabhost");
                }
            }

            if (type == "color-change") {
                this.customcolor = true;
                if (data.color == null) {
                    this.customcolor = false;
                    return;
                }
                this.tab_button.style.backgroundColor = data.color;
                if(wc_hex_is_light(data.color)) {
                    this.tab_button.style.color = "black";
                } else {
                    this.tab_button.style.color = "white";
                }
            }
        })



        //end
        if (page) {
            this.navigate(page);
        }
        else {
            this.navigate("home");
        }
        this.focus();
        onTabUpdate();
        ipcRenderer.send("addListeners")


        //dynamic tab button
        if (Object.keys(tabs).length < 6) {
            for (var x in tabs) {
                const tab_button = tabs[x].tab_button;
                tab_button.style.width = "calc(100% / " + Object.keys(tabs).length + ")"
            }
        }
        else {
            this.tab_button.style.width = "calc(100% / 5)"
        }

    }

    mute() {
        ipcRenderer.send("mute", this.id);
    }

    navigate(url) {
        //load url
        ipcRenderer.send("navigate", { uuid: this.id, url: url });
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
        hideErrorPage();
        //focus tab

        focused_tab = this.id;
        document.title = this.title.innerHTML + " - Carbon"
        for (var x in tabs) {
            if (x != this.id) {
                tabs[x].hide();
            }
        }

        if (this.customcolor != true) {
            this.tab_button.style.backgroundColor = "rgba(255,255,255, 0.150)";
        }
        this.isFocused = true;
        ipcRenderer.send("focusTab", this.id)
        var url = this.getUrl();
        if (url != "no_change") {
            document.getElementById("urlbar").value = url;
        }

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

        if (this.error != false) {
            const errorPageElement = showErrorPage(this.error.code, this.error.description);
            const reloadButton = document.createElement("button");
            reloadButton.innerHTML = "Retry";
            errorPageElement.appendChild(reloadButton);
            reloadButton.onclick = () => {
                this.reload();
            }
            hideCurrentTab();
        }
    }

    hide() {
        //hide tab
        this.isFocused = false;
        if (this.customcolor != true) {
            this.tab_button.style.backgroundColor = "transparent";
        }
    }

    back() {
        //goback
        ipcRenderer.send("goBack", this.id)
    }

    reload() {
        //reload
        ipcRenderer.send("reload", this.id);
    }

    forward() {
        //goforward
        ipcRenderer.send("goForward", this.id)
    }

    destroy() {
        //close tab
        ipcRenderer.send("removeTab", this.id);
        this.tab_button.style.width = "0%";
        setTimeout(() => {
            this.tab_button.remove();
        }, 200);
        delete tabs[this.id];

        //dynamic tab button
        if (Object.keys(tabs).length < 6) {
            for (var x in tabs) {
                const tab_button = tabs[x].tab_button;
                tab_button.style.width = "calc(100% / " + Object.keys(tabs).length + ")"
            }
        }

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
        ipcRenderer.send("openDevTools", this.id)
    }
}

function showErrorPage(code, description) {
    const element = document.getElementById("error_page");
    element.style.display = "block";
    element.innerHTML += "<h1>An error occoured while loading the page!</h1>";
    element.innerHTML += "<p>Code: " + code + "</p>";
    element.innerHTML += "<p>Description: "+ description +"</p>";
    return element;
}

function hideErrorPage() {
    const element = document.getElementById("error_page");
    element.style.display = "none";
    element.innerHTML = "";
}

ipcRenderer.on("new_tab", (e, url) => {
    new tab(url);
})

function newTab(url) {
    new tab(url);
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

const immersiveInterfaceEnabled = settings.readKeyFromFile("experimental.conf.json", "immersive_interface");

if (immersiveInterfaceEnabled == true) {
    const topbar_image = document.getElementById("immersive_topbar");
    document.getElementById("topbar").style.backgroundColor = "rgba(0,0,0,0.6)";
    document.getElementById("topbar").style.backdropFilter = "blur(10px)";
    topbar_image.style.display = "block";

    ipcRenderer.on("base64", (e, image) => {
        topbar_image.src = image;
    });

    setInterval(() => {
        ipcRenderer.send("getBase64"); 
    }, 40);
}