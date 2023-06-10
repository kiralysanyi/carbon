const { ipcRenderer } = require("electron");
const settings = require("../main-js/settings");
var timeouts = {};
var downloads_saved = JSON.parse(settings.readData("download.history.json"));

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

showLoader();

const container = document.getElementById("container");

readSaved();
readCurrent();

setInterval(() => {
    readCurrent();
    readSaved();
}, 1000);

document.getElementById("clearDownloads").onclick = () => {
    settings.saveData("download.history.json", "{}");
    container.innerHTML = "";
    readSaved();
};

function readSaved() {
    downloads_saved = JSON.parse(settings.readData("download.history.json"));
    for (var x in downloads_saved) {
        var item = downloads_saved[x]; //time file url
        var element;
        element = document.getElementById(x);
        if (element == undefined) {
            element = document.createElement("div");
            element.id = x;
            element.classList.add("downloaditem");
            container.appendChild(element);
        } else {
            element.innerHTML = "";
            element.innerHTML += "<h2>" + item.file + "</h2>";
            element.innerHTML += "<p>" + item.url + "</p>";
            var date = new Date(item.time);

            element.innerHTML += "<p>" + date.toDateString(); + "</p>";
        }
    }
}



function readCurrent() {
    var current_downloads = JSON.parse(ipcRenderer.sendSync("getDownloads"));
    for (var x in current_downloads) {
        var item = current_downloads[x]; //state file url received total
        var percentage = item.received / item.total * 100;
        var speed = (item.speed / 1024 / 1024).toFixed(2);
        percentage = Math.floor(percentage);
        var element = document.getElementById(x);
        var info_container = document.getElementById("inf" + x);
        if (element == undefined) {
            element = document.createElement("div");
            element.id = x;
            element.classList.add("downloaditem");
            info_container = document.createElement("div");
            info_container.classList.add("dlinfo");
            element.appendChild(info_container);
            info_container.id = "inf" + x;
            container.appendChild(element);
            var cancel_btn = document.createElement("button");
            var pause_btn = document.createElement("button");
    
            cancel_btn.classList.add("cancel_btn");
            pause_btn.classList.add("pause_btn");
    
            pause_btn.innerHTML = '<i class="lni lni-pause"></i>';
            cancel_btn.innerHTML = '<i class="lni lni-close"></i>';
    
            cancel_btn.onclick = () => {
                console.log("Cancelling: ", x)
                ipcRenderer.send("cancel", x);
            }
    
            pause_btn.onclick = () => {
                console.log("Pausing: ", x)
                ipcRenderer.send("pause", x);
            }

            pause_btn.id = "p" + x;
            element.appendChild(cancel_btn);
            element.appendChild(pause_btn);
        }


        

        info_container.innerHTML = "";
        info_container.innerHTML += "<h2>" + item.file + " [" + item.state + "]</h2>";
        info_container.innerHTML += "<p>" + item.url + "</p>";
        info_container.innerHTML += "<a class='percentage'>" + percentage + "%</a>";
        info_container.innerHTML += "<a class='speed'>" + speed + "MB/s</a>"
        info_container.innerHTML += "<div class='progress_bar' style='width: " + percentage + "%;'></div>";
        if (item.state == "paused") {
            document.getElementById("p" + x).innerHTML = '<i class="lni lni-play"></i>';
        } else {
            document.getElementById("p" + x).innerHTML = '<i class="lni lni-pause"></i>';
        }
        try {
            clearTimeout(timeouts[x]);
        } catch (error) {

        }
        timeouts[x] = setTimeout(() => {
            element.remove();
        }, 1500);
    }
}

hideLoader();
if (process.platform == "win32" || process.platform == "darwin") {
    document.getElementById("window_controls").style.display = "none";
}

if (process.platform == "darwin") {
    document.getElementById("toolbar").style.left = "80px";
}

ipcRenderer.on("applyTheme", (e, theme) => {
    applyTheme(theme);
});

//apply theme
function applyTheme(theme) {
    if (theme == "light") {
        var head = document.getElementsByTagName('head')[0];

        // Creating link element
        var style = document.createElement('link');
        style.id = "lightthemecss"
        style.href = 'light.css'
        style.type = 'text/css'
        style.rel = 'stylesheet'
        head.append(style);
    } else {
        try {
            document.getElementById("lightthemecss").remove();
        } catch (error) {
            console.log("Light theme not loaded. I'm doing nothing.");
        }
    }
}