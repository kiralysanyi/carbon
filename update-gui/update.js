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

ipcRenderer.on("update_percentage", (percentage) => {
    question_display.innerHTML = "Downloading update, please wait!";
    document.getElementById("statusbar").style.width = percentage;
    document.getElementById("button_bar").style.display = "none";
})