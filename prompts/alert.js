const { ipcRenderer } = require("electron");

var confirm_button = document.getElementById("confirm");
var text_display = document.getElementById("display");
const winID = navigator.userAgent;
const text = ipcRenderer.sendSync(winID + "text");
text_display.innerHTML = text;

confirm_button.onclick = () => {
    ipcRenderer.send(winID + "answer");
}


//apply theme
function applyTheme(theme) {
    if (theme == "light") {
        var head = document.getElementsByTagName('head')[0];

        // Creating link element
        var style = document.createElement('link');
        style.id = "lightthemecss"
        style.href = 'light.css'
        style.type = 'text/css'
        style.rel = 'stylesheet'
        head.append(style);
    } else {
        try {
            document.getElementById("lightthemecss").remove();
        } catch (error) {
            console.log("Light theme not loaded. I'm doing nothing.");
        }
    }
}

applyTheme(ipcRenderer.sendSync("getTheme"));
