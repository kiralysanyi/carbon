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