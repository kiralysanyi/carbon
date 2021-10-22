const { ipcRenderer } = require("electron");

var confirm_button = document.getElementById("confirm");
var cancel_button = document.getElementById("cancel");
var question_display = document.getElementById("question");
const winID = navigator.userAgent;
const question = ipcRenderer.sendSync(winID + "question");
question_display.innerHTML = question;

confirm_button.onclick = () => {
    ipcRenderer.send(winID + "answer", true);
}

cancel_button.onclick = () => {
    ipcRenderer.send(winID + "answer", false);
}