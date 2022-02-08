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

getVersion = () => {
    return ipcRenderer.sendSync("getVersion");
}

isDebug = () => {
    return ipcRenderer.sendSync("isDebug");
}