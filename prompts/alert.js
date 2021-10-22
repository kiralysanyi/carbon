const { ipcRenderer } = require("electron");

var confirm_button = document.getElementById("confirm");
var text_display = document.getElementById("display");
const winID = navigator.userAgent;
const text = ipcRenderer.sendSync(winID + "text");
text_display.innerHTML = text;

confirm_button.onclick = () => {
    ipcRenderer.send(winID + "answer");
}