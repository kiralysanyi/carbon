const remote = require("@electron/remote");
const win = remote.getCurrentWindow();

closewin = () => {
    win.close();
}

minimize = () => {
    win.minimize();
}

maximize = () => {
    if (win.isMaximized()) {
        win.unmaximize();
    }
    else {
        win.maximize();
    }
}