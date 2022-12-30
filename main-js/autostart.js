const { app } = require("electron");

const updateStartupConfig = (startup) =>{
    app.setLoginItemSettings({
        args: ["--nowindowinit"],
        openAtLogin: startup
    })
}

const getStartupConfig = () => {
    try {
        console.log(app.getLoginItemSettings());
        return app.getLoginItemSettings().executableWillLaunchAtLogin;
    } catch (error) {
        console.log("Error: ", error);
        return false;
    }
}

module.exports = {
    updateStartupConfig,
    getStartupConfig
}