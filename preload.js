const { ipcRenderer } = require("electron");

closewin = () => {
    ipcRenderer.sendSync("closewin")
}

minimize = () => {
    ipcRenderer.sendSync("minimize");
}

maximize = () => {
    ipcRenderer.sendSync("maximize");
}