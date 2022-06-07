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
    var pattern = new RegExp(
        '^(https?:\\/\\/)?' + // protocol1
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
    return !!pattern.test(str);
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

function openMenu() {
    ipcRenderer.send("openMenu")
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

const startup_url = ipcRenderer.sendSync("openFirst");

if (startup_url != "null") {
    newTab(startup_url);
}
else {
    newTab();
}

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
    document.getElementById("toolbar").style.display = "none";
    showPlaceHolder();
    const modal = document.getElementById("settings_modal");
    modal.style.transform = "translate(-50%, -50%) scale(0, 0)"
    modal.style.display = "block";
    document.getElementById("settings_iframe").reload();
    

    setTimeout(() => {
        modal.style.transform = "translate(-50%, -50%) scale(1, 1)"
    }, 10);

    if (isDebug()) {
        document.getElementById("settings_iframe").openDevTools();
    }
    document.getElementById("settings_modal_back").style.display = "block";
    document.getElementById("settings_modal_back").style.backdropFilter = "blur(32px)";
}

function hideSettingsModal() {
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
    }, 100);
})

urlbar.addEventListener("focus", () => {
    showSuggestions();
});

ipcRenderer.on("show-update-button", (e) => {
    document.getElementById("update-button").style.display = "block";
    document.getElementById("settings_iframe").send("show-update");
})

ipcRenderer.on("hide-update-button", (e) => {
    document.getElementById("update-button").style.display = "none";
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