const {BrowserWindow, ipcMain} = require("electron")

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

const prompts = {};

var confirm = (question, promptid) => {
    if (!promptid) {
        console.log("No promptid provided!");
        return false;
    }

    if (prompts[promptid] == "pending") {
        console.log("Question already asked");
        return false;
    }

    prompts[promptid] = "pending";

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
            delete prompts[promptid];
            resolved(args)
            win.close();
        })
    })
}


var updatePrompt = (question, promptid) => {
    if (!promptid) {
        console.log("No promptid provided!");
        return false;
    }

    if (prompts[promptid] == "pending") {
        console.log("Question already asked");
        return false;
    }

    prompts[promptid] = "pending";

    return new Promise((resolved) => {
        const winID = uuidv4();
        const win = new BrowserWindow({
            width: 400,
            height: 550,
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
        win.loadFile("update-gui/update.html");
        //win.webContents.openDevTools();

        ipcMain.once(winID + "updateinfo", (e) => {
            e.returnValue = question;
        })

        ipcMain.once(winID + "answer", (e, args) => {
            delete prompts[promptid];

            if (args == false) {
                win.close();
                resolved(args);
            } else {
                resolved((exit) => {
                    if (exit == true) {
                        win.close();
                    }
                })
            }
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
    alert: alert,
    updatePrompt: updatePrompt
}