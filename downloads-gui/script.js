const { ipcRenderer } = require("electron");
const settings = require("../settings");

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

for (var x in downloads_saved) {
    var item = downloads_saved[x]; //time file url
    var element = document.createElement("div");
    element.id = x;
    element.classList.add("downloaditem");
    element.innerHTML += "<h2>" + item.file + "</h2>";
    element.innerHTML += "<p>" + item.url + "</p>";
    var date = new Date(item.time);

    element.innerHTML += "<p>" + date.toDateString(); + "</p>";
    container.appendChild(element);
}

setInterval(() => {
    container.innerHTML = "";
    var current_downloads = JSON.parse(ipcRenderer.sendSync("getDownloads"));
    for (var x in current_downloads) {
        var item = current_downloads[x]; //state file url received total
        var percentage = item.received / item.total * 100;
        percentage = Math.floor(percentage);
        var element = document.createElement("div");
        element.id = x;
        element.classList.add("downloaditem");
        element.innerHTML += "<h2>" + item.file + " [" + item.state + "]</h2>";
        element.innerHTML += "<p>" + item.url + "</p>";
        element.innerHTML += "<a class='percentage'>" + percentage + "%</a>";
        element.innerHTML += "<div class='progress_bar' style='width: " + percentage + "%;'></div>";

        var cancel_btn = document.createElement("button");
        var pause_btn = document.createElement("button");
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

        element.appendChild(cancel_btn);
        element.appendChild(pause_btn);

        container.appendChild(element);
    }

    for (var y in downloads_saved) {
        var item = downloads_saved[y]; //time file url
        var element = document.createElement("div");
        element.id = y;
        element.classList.add("downloaditem");
        element.innerHTML += "<h2>" + item.file + "</h2>";
        element.innerHTML += "<p>" + item.url + "</p>";
        var date = new Date(item.time);
    
        element.innerHTML += "<p>" + date.toDateString(); + "</p>";
        container.appendChild(element);
    }
    
}, 1000);

hideLoader();