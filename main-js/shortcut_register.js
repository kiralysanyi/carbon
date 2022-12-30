const { globalShortcut, app } = require("electron")
let endCapture;
const register = (window, end) => {
    endCapture = end;
    globalShortcut.register('F5', () => {
        if (window == null) {
            return;
        };
        if (window.win.isFocused()) {
            console.log(window.focusedTab());
            window.focusedTab().webContents.reload();
        };
    })

    globalShortcut.register('Ctrl+F12', () => {
        console.log(window.focusedTab());
        window.focusedTab().webContents.openDevTools({ mode: "detach" });
    })

    globalShortcut.register("Ctrl+Tab", () => {
        if (window == null) {
            return;
        };
        if (window.win.isFocused()) {
            window.win.webContents.send("openOverview")
        }
    })

    globalShortcut.register("F1", () => {
        endCapture();
    })
}

app.on("will-quit", () => {
    globalShortcut.unregisterAll();
})

const unregister = () => {
    globalShortcut.unregisterAll();
    globalShortcut.register("F1", () => {
        endCapture();
    })
}

module.exports = { register, unregister }