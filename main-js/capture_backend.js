const { desktopCapturer, ipcMain, BrowserWindow } = require("electron");
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


ipcMain.on("getSources", async (e) => {
    e.returnValue = await getSources();
})

ipcMain.on("capturePrompt", async (e) => {
    e.returnValue = await createShareWindow(e.sources);
})