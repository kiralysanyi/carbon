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

        this.webview = document.createElement("webview");
        this.tab_button = document.createElement("div");
        this.title = document.createElement("a");
        this.favicon = document.createElement("img");
        this.close_btn = document.createElement("div");
        this.close_btn.classList.add("close");
        this.tab_button.appendChild(this.close_btn);

        this.close_btn.innerHTML = "<i class='lni lni-close'></i>"

        this.tab_button.appendChild(this.title);
        this.tab_button.appendChild(this.favicon);

        this.webview.src = startpage;
        this.webview.useragent = USERAGENT;

        container.appendChild(this.webview);
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
                document.getElementById("urlbar").value = this.webview.getURL();
            }
        }

        this.webview.webpreferences = "sandbox"
        
        this.webview.addEventListener("loadstart", () => {
            loadstart();
        });

        this.webview.addEventListener("did-start-navigation", () => {
            loadstart();
        })

        this.webview.addEventListener("did-start-loading", () => {
            loadstart();
        })

        this.webview.addEventListener("did-stop-loading", () => {
            loadend();
        })

        this.webview.addEventListener("did-finish-load", () => {
            loadend();
        })

        this.webview.addEventListener("page-favicon-updated", (e) => {
            this.favicon.src = e.favicons[e.favicons.length - 1];
        })

        this.webview.addEventListener("page-title-updated", (e) => {
            this.title.innerHTML = e.title;
        })

        this.webview.addEventListener("dom-ready", () => {
            this.focus();
            this.webview.openDevTools();
        })

        this.webview.addEventListener("crashed", (e) => {
            console.warn("Webview crash!", "ID:" + this.id, "type: " + e.type)
        })

        this.webview.addEventListener("error", (e) => {
            console.warn("Webview error: ", e.error);
        })

        this.webview.addEventListener("waiting", (e) => {
            console.log("[" + this.id + "]: ", e)
        })

        

        onTabUpdate();
    }

    navigate(url) {
        this.webview.loadURL(url);
    }

    focus() {
        focused_tab = this.id;
        for (var x in tabs) {
            if (x != this.id) {
                tabs[x].hide();
            }
        }
        this.tab_button.style.backgroundColor = "rgba(255,255,255, 0.150)";
        this.webview.style.display = "flex";
        this.isFocused = true;
        document.getElementById("urlbar").value = this.webview.getURL();
    }

    hide() {
        this.isFocused = false;
        this.webview.style.display = "none";
        this.tab_button.style.backgroundColor = "transparent";
    }

    back() {
        if (this.webview.canGoBack()) {
            this.webview.goBack();
        }
    }

    destroy() {
        delete tabs[this.id];
        this.webview.remove();
        this.tab_button.remove();
        if (focused_tab == this.id) {
            var highest = tabs[Object.keys(tabs).sort().pop()];
            if (highest) {
                highest.focus();
            }
            else {
                focused_tab = null;
                console.log("All tabs closed")
                document.getElementById("urlbar").value = "";
            }
        }
    }
}

function newTab() {
    new tab();
}

function goBack() {
    getTab(focused_tab).back();
}