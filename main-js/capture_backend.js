const { desktopCapturer, ipcMain, BrowserWindow, globalShortcut, app, Notification } = require("electron");
const getSources = () => {
    return new Promise(async (resolved) => {
        const sources = await desktopCapturer.getSources({
            types: ["screen", "window"],
            fetchWindowIcons: false
        });
        resolved(sources);
    });
}

async function createShareWindow(sources) {
    return new Promise((done) => {
        const win = new BrowserWindow({
            alwaysOnTop: true,
            width: 600,
            height: 500,
            resizable: false,
            minimizable: false,
            maximizable: false,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
            },
        });

        win.removeMenu();
        win.webContents.openDevTools();
        ipcMain.once("source", (e, args) => {
            win.close();
            e.returnValue = null;
            console.log(args);
            done(args);
            new Notification({
                body: "Press F1 to stop capture",
                title: "Screen capture"
            }).show();
        });

        win.once("closed", () => {
            console.log("Window closed");
        });

        win.webContents.on("did-finish-load", () => {
            win.webContents.send("startInit");
        })

        win.loadFile("./display-share-prompt/index.html");
    });
}

var requesters = [];

ipcMain.on("getSources", async (e) => {
    e.returnValue = await getSources();
})

ipcMain.on("capturePrompt", async (e) => {
    requesters.push(e.sender);
    e.returnValue = await createShareWindow(e.sources);
})

const endCapture = () => {
    console.log("Stopping screenshare");
    for(var x in requesters) {
        requesters[x].send("stopSharing")
    }
}

module.exports = {
    endCapture
}