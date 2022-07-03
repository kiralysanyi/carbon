const { app } = require("electron");

app.setLoginItemSettings({
    args: ["--nowindowinit"],
    openAtLogin: true
})