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

newTab();


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
})

afterinit = true;