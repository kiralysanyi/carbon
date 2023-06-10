const { ipcRenderer } = require("electron");

var confirm_button = document.getElementById("confirm");
var cancel_button = document.getElementById("cancel");
var question_display = document.getElementById("question");
const winID = navigator.userAgent;
const question = ipcRenderer.sendSync(winID + "question");
question_display.innerHTML = question;

confirm_button.onclick = () => {
    ipcRenderer.send(winID + "answer", true);
}

cancel_button.onclick = () => {
    ipcRenderer.send(winID + "answer", false);
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
