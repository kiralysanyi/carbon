const { app, session, ipcMain, Notification } = require("electron");
const { randomUUID } = require("crypto");
const settings = require("./settings");

//download handling 

var current_downloads = {};
var dlitems = {};

app.on("session-created", () => {
    session.defaultSession.on("will-download", (e, item, webcontents) => {
        new Notification({ title: "Download information", body: "Download has been started: " + item.getFilename() }).show()
        const DLID = randomUUID();
        dlitems[DLID] = item;
        var received0 = 0
        var speed = 0;
        var received = 0;
        item.on('updated', (event, state) => {
            if (state == 'interrupted') {
                console.log('Download is interrupted but can be resumed');
                current_downloads[DLID] = {
                    "state": "paused",
                    "received": received,
                    "file": item.getFilename(),
                    "url": item.getURL(),
                    "total": item.getTotalBytes(),
                    "speed": 0
                }
            } else if (state === 'progressing') {
                if (item.isPaused()) {
                    console.log('Download is paused')
                    current_downloads[DLID] = {
                        "state": "paused",
                        "received": received,
                        "file": item.getFilename(),
                        "url": item.getURL(),
                        "total": item.getTotalBytes(),
                        "speed": 0
                    }
                } else {
                    received = item.getReceivedBytes();
                    speed = received - received0;
                    received0 = received;
                    current_downloads[DLID] = {
                        "state": state,
                        "received": received,
                        "file": item.getFilename(),
                        "url": item.getURL(),
                        "total": item.getTotalBytes(),
                        "speed": speed
                    }
                }
            }
        })
        item.once('done', (event, state) => {
            if (state == 'completed') {
                var date = new Date();
                console.log('Download successfully')
                var saved_downloads = JSON.parse(settings.readData("download.history.json"));
                saved_downloads[DLID] = {
                    "file": item.getFilename(),
                    "url": item.getURL(),
                    "time": date.getTime()
                }
                settings.saveData("download.history.json", JSON.stringify(saved_downloads));
                new Notification({ title: "Download information", body: "Download has been completed: " + item.getFilename() }).show()
            } else {
                console.log(`Download failed: ${state}`)
                new Notification({ title: "Download information", body: "Download failed: " + item.getFilename() }).show()
            }

            delete current_downloads[DLID];

        })

    })

    ipcMain.on("cancel", (e, dlid) => {
        console.log("Download cancelled", dlid);
        dlitems[dlid].cancel();
    })

    ipcMain.on("pause", (e, dlid) => {
        console.log("Download paused", dlid);
        if (dlitems[dlid].isPaused()) {
            dlitems[dlid].resume();
        }
        else {
            dlitems[dlid].pause();
        }
    })

    ipcMain.on("getDownloads", (e) => {
        e.returnValue = JSON.stringify(current_downloads);
    })

})