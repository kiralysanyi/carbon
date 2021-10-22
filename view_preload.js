const {ipcRenderer} = require("electron")
console.log("Gutten tag! Preload loaded");

window.alert = (text) => {
    ipcRenderer.sendSync("alert", text);
}