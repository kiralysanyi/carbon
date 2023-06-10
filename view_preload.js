const { ipcRenderer } = require("electron")
const settings = require("./main-js/settings");

window.alert = (text) => {
    ipcRenderer.sendSync("alert", text);
}

window.prompt = null;

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
            const data = JSON.parse(settings.readData("history.json", "{}"));
            resolved(data);
        }
    });
}

carbonAPI.removeHistoryItem = (url) => {
    if (isHomePage()) {
        const data = JSON.parse(settings.readData("history.json", "{}"));
        delete data[url];
        settings.saveData("history.json", JSON.stringify(data));
    }
}

carbonAPI.clearHistory = () => {
    if (isHomePage()) {
        settings.saveData("history.json", "{}");
    }
}

carbonAPI.getTheme = () => {
    return ipcRenderer.sendSync("getTheme");
}

carbonAPI.experimental = {};

carbonAPI.experimental.isBlurRemoved = () => {
    return ipcRenderer.sendSync("isBlurRemoved");
}

const ColorThief = require('colorthief');

carbonAPI.experimental.ColorThief = ColorThief;

function wc_hex_is_light(color) {
    const hex = color.replace('#', '');
    const c_r = parseInt(hex.substr(0, 2), 16);
    const c_g = parseInt(hex.substr(2, 2), 16);
    const c_b = parseInt(hex.substr(4, 2), 16);
    const brightness = ((c_r * 299) + (c_g * 587) + (c_b * 114)) / 1000;
    return brightness > 155;
}

carbonAPI.experimental.wc_hex_is_light = wc_hex_is_light;

console.log("Gutten tag! Preload loaded");

function createShareWindow() {
    return new Promise((resolved) => {
        const selected = ipcRenderer.sendSync("capturePrompt");
        resolved(selected)
    });
}


async function sharePrompt() {
    return new Promise(async (done) => {
        var sources = ipcRenderer.sendSync("getSources");
        console.log("Sources: ", sources);
        const selected = await createShareWindow(sources);
        if (selected == null) {
            console.log(selected);
            console.log("Screen share cancelled");
            return null;
        }
        console.log("Selected: ", sources[selected], selected);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: sources[selected].id,
                        minWidth: 1280,
                        maxWidth: 1280,
                        minHeight: 720,
                        maxHeight: 720
                    }
                }
            })
            console.log("Da stream: ", stream);
            ipcRenderer.once("stopSharing", () => {
                console.log("Stopping capture")
                const tracks = stream.getTracks();
                for (var x in tracks) {
                    tracks[x].stop();
                }
            })
            done(stream);
        } catch (error) {
            console.error(error);
        }
    });
}

async function screenshare() {
    return new Promise(async (gotstream) => {
        var src = await sharePrompt();
        gotstream(src);
    });
}


navigator.mediaDevices.getDisplayMedia = screenshare