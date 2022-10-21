function showLoader() {
    document.getElementById("loader").style.display = "block";
}

function hideLoader() {
    document.getElementById("loader").style.display = "none";
}

function transformScroll(event) {
    if (!event.deltaY) {
        return;
    }

    event.currentTarget.scrollLeft += event.deltaY + event.deltaX;
    event.preventDefault();
}

document.getElementById("tab_bar").addEventListener("wheel", transformScroll)

function validURL(str) {
    try {
        new URL(str);
        return true
    } catch (error) {
        return false;
    }
}

var urlbar = document.getElementById("urlbar");


window.addEventListener("keydown", (e) => {
    if (e.key == "Enter" && document.activeElement == urlbar) {
        var url = urlbar.value;
        urlbar.blur();

        if (url.substring(0, 7) == "file://") {
            navigate(url);
            return 0;
        }
        if (validURL(url) == true) {
            var pat = /^https?:\/\//i;
            if (pat.test(url)) {
                navigate(url);
            } else {
                url = "http://" + url;
                navigate(url);
            }

        } else {
            var search = ipcRenderer.sendSync("searchString") + url
            navigate(search);
        }
    }
})

//initialize menu

const toolbar_menu = document.getElementById("toolbar_menu");
toolbar_menu.style.display = "none";

document.getElementById("open_menu").addEventListener("click", (e) => {
    e.stopPropagation();
    openMenu();
})

document.getElementById("open_menu").addEventListener("blur", (e) => {
    setTimeout(() => {
        closeMenu();
    }, 100);
})

const toolbar_menu_items = document.getElementsByClassName("toolbar_button");

function animateButtons() {
    for (let i = 0; i < toolbar_menu_items.length; i++) {
        toolbar_menu_items[i].style.transition = "0ms";
        toolbar_menu_items[i].style.bottom = "-40px";
        setTimeout(() => {
            toolbar_menu_items[i].style.transition = "200ms";
        }, 20);
    }
    
    let x = 0;
    const animate = () => {
        if (x >= toolbar_menu_items.length) {
            return;
        }
        toolbar_menu_items[x].style.bottom = "0px";
        x += 1;
        setTimeout(() => {
            animate();
        }, 100);
    }

    animate();
}

function openMenu() {
    toolbar_menu.style.display = "block";
    setTimeout(() => {
        toolbar_menu.style.opacity = 1;
        animateButtons();
        toolbar_menu.style.width = "190px";
    }, 10);
}

function closeMenu() {
    toolbar_menu.style.opacity = 0;
    toolbar_menu.style.width = "0px";
    setTimeout(() => {
        toolbar_menu.style.display = "none"
    }, 300);
}

function openDownloads() {
    ipcRenderer.send("opendownloads")
}

ipcRenderer.on("command", (e, command) => {
    if (command == "reload") {
        reload();
    }

    if (command == "devtools") {
        openDevTools();
    }

    if (command == "settings") {
        showSettingsModal();
    }
})

afterinit = true;

newTab();

function hideCurrentTab() {
    return ipcRenderer.sendSync("hideCurrentTab");
}

function showCurrentTab() {
    return ipcRenderer.sendSync("showCurrentTab");
}

function showPlaceHolder() {
    const placeholder = document.getElementById("tab_placeholder");
    placeholder.style.display = "block";
    placeholder.src = hideCurrentTab();
}

function hidePlaceHolder() {
    const placeholder = document.getElementById("tab_placeholder");
    placeholder.style.display = "none";
    showCurrentTab();
}

ipcRenderer.on("update-state", (e, state) => {
    console.log(state)
    document.getElementById("settings_iframe").send("update-state", state);
})

function showSettingsModal() {
    document.getElementById("hideSettings").style.display = "block";
    if (process.platform == "darwin") {
        document.getElementById("hideSettings").style.left = "unset";
        document.getElementById("hideSettings").style.right = "0px";
        document.getElementById("hideSettings").style.position = "fixed";
    }
    document.getElementById("toolbar").style.display = "none";
    showPlaceHolder();
    const modal = document.getElementById("settings_modal");
    modal.style.transform = "scale(0, 0)"
    modal.style.display = "block";


    setTimeout(() => {
        modal.style.transform = "scale(1, 1)"
    }, 10);

    if (isDebug()) {
        document.getElementById("settings_iframe").openDevTools();
    }
    document.getElementById("settings_modal_back").style.display = "block";
    document.getElementById("settings_modal_back").style.backdropFilter = "blur(32px)";
}

document.getElementById("hideSettings").style.display = "none";

function hideSettingsModal() {
    document.getElementById("hideSettings").style.display = "none";
    if (isDebug()) {
        document.getElementById("settings_iframe").closeDevTools();
    }
    document.getElementById("toolbar").style.display = "block";
    const modal = document.getElementById("settings_modal");
    modal.style.transform = "translate(-50%, -50%) scale(0, 0)"
    setTimeout(() => {
        modal.style.display = "none";
        document.getElementById("settings_modal_back").style.display = "none";
        document.getElementById("settings_modal_back").style.backdropFilter = "blur(0px)";
        hidePlaceHolder();
    }, 300);
}


function showSuggestions() {
    showPlaceHolder();
    const placeholder = document.getElementById("tab_placeholder");
    placeholder.style.filter = "blur(32px)";
    suggestion_dom.style.display = "block";
    suggestion_dom.style.left = urlbar.offsetLeft + 50 + "px";
    suggestion_dom.style.width = urlbar.clientWidth + "px";

}
const suggestion_dom = document.getElementById("suggestions");

window.addEventListener("resize", () => {
    suggestion_dom.style.left = urlbar.offsetLeft + 50 + "px";
    suggestion_dom.style.width = urlbar.clientWidth + "px";
})

function hideSuggestions() {
    suggestion_dom.style.display = "none";
    hidePlaceHolder();
    const placeholder = document.getElementById("tab_placeholder");
    placeholder.style.filter = "blur(0px)";
}

function updateSuggestions(searchtext) {
    suggestion_dom.innerHTML = "";
    const data = JSON.parse(settings.readData("history.json", "{}"));
    var object_count = 0;

    for (var x in data) {
        const obj = data[x];
        if (obj.url.search(searchtext) > 0) {
            const element = document.createElement("div");
            element.innerHTML = obj.url;
            suggestion_dom.appendChild(element);
            object_count++;
            element.onclick = () => {
                navigate(obj.url);
            }
        }
    }

    if (object_count < 10) {
        suggestion_dom.style.height = object_count * 40 + "px";
        suggestion_dom.style.overflowY = "hidden";
    } else {
        suggestion_dom.style.height = "400px";
        suggestion_dom.style.overflowY = "scroll";
    }
}

document.addEventListener("keydown", () => {
    if (document.activeElement == urlbar) {
        setTimeout(() => {
            updateSuggestions(urlbar.value);
        }, 100);
    }
});


urlbar.addEventListener("blur", () => {
    setTimeout(() => {
        hideSuggestions();
        suggestion_dom.innerHTML = "";
        suggestion_dom.style.height = "0px";
    }, 200);
})

urlbar.addEventListener("focus", () => {
    showSuggestions();
});

ipcRenderer.on("show-update-button", (e) => {
    document.getElementById("update-button").style.display = "block";
    document.getElementById("settings_iframe").send("show-update");
})

ipcRenderer.on("hide-update", () => {
    document.getElementById("settings_iframe").send("hide-update");
})

ipcRenderer.on("hide-update-button", (e) => {
    document.getElementById("update-button").style.display = "none";
    document.getElementById("update-button").innerHTML = '<i class="lni lni-arrow-up-circle"></i>'
})

ipcRenderer.on("show-update-loader", () => {
    const button = document.getElementById("update-button");
    var loader = document.createElement("div");
    loader.classList.add("spinner");
    button.innerHTML = "";
    button.appendChild(loader);
})

document.getElementById("update-button").addEventListener("click", () => {
    ipcRenderer.send("start-update");
})

function wc_hex_is_light(color) {
    try {
        const hex = color.replace('#', '');
        const c_r = parseInt(hex.substr(0, 2), 16);
        const c_g = parseInt(hex.substr(2, 2), 16);
        const c_b = parseInt(hex.substr(4, 2), 16);
        const brightness = ((c_r * 299) + (c_g * 587) + (c_b * 114)) / 1000;
        return brightness > 155;
    } catch (error) {
        return false
    }

}

const overview = document.getElementById("overview");

async function openOverview() {
    document.body.style.backgroundColor = "rgb(56, 56, 56)";
    isOverviewOpen = true;
    document.getElementById("toolbar").style.display = "none";
    const current_tab = getTab(focused_tab);
    overview.style.opacity = 0;
    overview.style.display = "grid";

    setTimeout(() => {
        var rect = current_tab.overview_tab.getBoundingClientRect();
        const to = {
            x: rect.left + "px",
            y: rect.top + "px",
            w: rect.width + "px",
            h: rect.height + "px"
        }

        const from = { x: "0px", y: "90px", w: "100%", h: "calc(100% - 90px)" };

        animateImage(from, to, hideCurrentTab());
        overview.style.opacity = 1;
        setTimeout(() => {
            document.body.style.backgroundColor = "white";
        }, 50);
    }, 100);
}

function closeOverview() {
    isOverviewOpen = false;
    document.getElementById("toolbar").style.display = "block";
    overview.style.display = "none";
}

function toggleOverview() {
    if (isOverviewOpen == true) {
        closeOverview();
        showCurrentTab();
    } else {
        openOverview();
    }
}

function animateImage(from, to, src) {
    const image = document.createElement("img");
    image.src = src;
    image.style.width = from.w;
    image.style.height = from.h;
    image.style.left = from.x;
    image.style.top = from.y;
    image.style.transition = "500ms";
    image.style.backgroundColor = "black";
    image.style.position = "fixed";
    image.style.zIndex = "999"
    document.body.appendChild(image);
    setTimeout(() => {
        image.style.width = to.w;
        image.style.height = to.h;
        image.style.left = to.x;
        image.style.top = to.y;
    }, 50);
    setTimeout(() => {
        image.remove();
    }, 500);
}

var isOverviewOpen = false;

ipcRenderer.on("openOverview", () => {
    toggleOverview();
})

if (process.platform == "win32" || process.platform == "darwin") {
    document.getElementById("window_controls").style.display = "none";
}

if(process.platform == "darwin") {
    document.getElementById("toolbar").style.left = "80px";
}

ipcRenderer.on("enter_fullscreen_darwin", () => {
    document.getElementById("toolbar").style.left = "10px";

});

ipcRenderer.on("leave_fullscreen_darwin", () => {
    document.getElementById("toolbar").style.left = "80px";

});