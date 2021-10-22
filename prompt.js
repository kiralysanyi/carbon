const {BrowserWindow, ipcMain} = require("electron")

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

var confirm = (question) => {
    return new Promise((resolved) => {
        const winID = uuidv4();
        const win = new BrowserWindow({
            width: 500,
            height: 280,
            resizable: false,
            frame: false,
            alwaysOnTop: true,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        win.removeMenu();
        win.webContents.setUserAgent(winID);
        win.loadFile("prompts/confirm.html");
        //win.webContents.openDevTools();

        ipcMain.once(winID + "question", (e) => {
            e.returnValue = question;
        })

        ipcMain.once(winID + "answer", (e, args) => {
            resolved(args)
            win.close();
        })
    })
}

var alert = (text) => {
    return new Promise((resolved) => {
        const winID = uuidv4();
        const win = new BrowserWindow({
            width: 500,
            height: 280,
            resizable: false,
            frame: false,
            alwaysOnTop: true,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        win.removeMenu();
        win.webContents.setUserAgent(winID);
        win.loadFile("prompts/alert.html");
        //win.webContents.openDevTools();

        ipcMain.once(winID + "text", (e) => {
            e.returnValue = text;
        })

        ipcMain.once(winID + "answer", (e) => {
            resolved()
            win.close();
        })
    })
}

ipcMain.on("alert", async (e, text) => {
    await alert(text);
    e.returnValue = 0;
})


module.exports = {
    confirm: confirm,
    alert: alert
}