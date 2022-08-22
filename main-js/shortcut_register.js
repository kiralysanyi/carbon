const { globalShortcut } = require("electron")

const register = (window) => {
    globalShortcut.register('F5', () => {
        if (window == null) {
            return;
        };
        if (window.win.isFocused()) {
            console.log(window.focusedTab);
            window.focusedTab.webContents.reload();
        };
    })

    globalShortcut.register('F12', () => {
        if (window == null) {
            return;
        };
        if (window.win.isFocused()) {
            console.log(window.focusedTab);
            window.focusedTab.webContents.openDevTools({mode: "detach"});
        }
    })

    globalShortcut.register("Ctrl+Tab", () => {
        if (window == null) {
            return;
        };
        if (window.win.isFocused()) {
            window.win.webContents.send("openOverview")
        }
    })
}

const unregister = () => {
    globalShortcut.unregisterAll();
}

module.exports = {register, unregister}