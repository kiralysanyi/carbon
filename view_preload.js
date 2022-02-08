const { ipcRenderer } = require("electron")
const settings = require("./settings");

window.alert = (text) => {
    ipcRenderer.sendSync("alert", text);
}

carbonAPI = {};

carbonAPI.getSearchEngine = () => {
    return settings.readKeyFromFile("general.conf.json", "searchEngine");
}

carbonAPI.getVersion = () => {
    return ipcRenderer.sendSync("getVersion");
}

carbonAPI.getSearchString = () => {
    return ipcRenderer.sendSync("searchString");
}

function isHomePage() {
    console.log(location.href);
    var homeURL = ipcRenderer.sendSync("getHomeURL");
    console.log(homeURL);
    if (new URL(homeURL).href == new URL(location.href).href) {
        return true;
    } else {
        return false;
    }
}

carbonAPI.getHistory = () => {
    return new Promise((resolved) => {
        if (isHomePage()) {
            const data = JSON.parse(settings.readData("history.json", "[]"));
            resolved(data);
        }
    });
}

carbonAPI.clearHistory = () => {
    if(isHomePage()) {
        settings.saveData("history.json", "{}");
    }
}

console.log("Gutten tag! Preload loaded");