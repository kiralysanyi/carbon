const { ipcRenderer } = require("electron");

var confirm_button = document.getElementById("confirm");
var cancel_button = document.getElementById("cancel");
var question_display = document.getElementById("question");
const winID = navigator.userAgent;
const question = ipcRenderer.sendSync(winID + "updateinfo");
question_display.innerHTML = question;

confirm_button.onclick = () => {
    ipcRenderer.send(winID + "answer", true);
}

cancel_button.onclick = () => {
    ipcRenderer.send(winID + "answer", false);
}
const showButtons = ipcRenderer.sendSync(winID + "showButtons");

if (showButtons == false) {
    cancel_button.style.display = "none";
    confirm_button.style.display = "none";
    document.getElementById("ok").style.display = "block";
}

document.getElementById("ok").addEventListener("click", () => {
    ipcRenderer.send(winID + "close");
})

ipcRenderer.on("update_percentage", (e, percentage) => {
    document.getElementById("statusbar").style.width = percentage + "%";
})

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

applyTheme(ipcRenderer.sendSync("getTheme"));