const { ipcRenderer } = require("electron")
const settings = require("./main-js/settings");

window.alert = (text) => {
    ipcRenderer.sendSync("alert", text);
}

window.prompt = null;

carbonAPI = {};

carbonAPI.getSearchEngine = () => {
    return settings.readKeyFromFile("general.conf.json", "searchEngine");
}

carbonAPI.getVersion = () => {
    return ipcRenderer.sendSync("getVersion");
}

carbonAPI.getSearchString = () => {
    return ipcRenderer.sendSync("searchString");
}

function isHomePage() {
    console.log(location.href);
    var homeURL = ipcRenderer.sendSync("getHomeURL");
    console.log(homeURL);
    if (new URL(homeURL).href == new URL(location.href).href) {
        return true;
    } else {
        return false;
    }
}

carbonAPI.getHistory = () => {
    return new Promise((resolved) => {
        if (isHomePage()) {
            const data = JSON.parse(settings.readData("history.json", "{}"));
            resolved(data);
        }
    });
}

carbonAPI.removeHistoryItem = (url) => {
    if (isHomePage()) {
        const data = JSON.parse(settings.readData("history.json", "{}"));
        delete data[url];
        settings.saveData("history.json", JSON.stringify(data));
    }
}

carbonAPI.clearHistory = () => {
    if (isHomePage()) {
        settings.saveData("history.json", "{}");
    }
}

carbonAPI.getTheme = () => {
    return ipcRenderer.sendSync("getTheme");
}

carbonAPI.experimental = {};

carbonAPI.experimental.isBlurRemoved = () => {
    return ipcRenderer.sendSync("isBlurRemoved");
}

const ColorThief = require('colorthief');

carbonAPI.experimental.ColorThief = ColorThief;

function wc_hex_is_light(color) {
    const hex = color.replace('#', '');
    const c_r = parseInt(hex.substr(0, 2), 16);
    const c_g = parseInt(hex.substr(2, 2), 16);
    const c_b = parseInt(hex.substr(4, 2), 16);
    const brightness = ((c_r * 299) + (c_g * 587) + (c_b * 114)) / 1000;
    return brightness > 155;
}

carbonAPI.experimental.wc_hex_is_light = wc_hex_is_light;

console.log("Gutten tag! Preload loaded");

function createShareWindow() {
    return new Promise((resolved) => {
        const selected = ipcRenderer.sendSync("capturePrompt");
        resolved(selected)
    });
}


async function sharePrompt() {
    return new Promise(async (done) => {
        var sources = ipcRenderer.sendSync("getSources");
        console.log("Sources: ", sources);
        const selected = await createShareWindow(sources);
        if (selected == null) {
            console.log(selected);
            console.log("Screen share cancelled");
            return null;
        }
        console.log("Selected: ", sources[selected], selected);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: sources[selected].id,
                        minWidth: 1280,
                        maxWidth: 1280,
                        minHeight: 720,
                        maxHeight: 720
                    }
                }
            })
            console.log("Da stream: ", stream);
            ipcRenderer.once("stopSharing", () => {
                console.log("Stopping capture")
                const tracks = stream.getTracks();
                for (var x in tracks) {
                    tracks[x].stop();
                }
            })
            done(stream);
        } catch (error) {
            console.error(error);
        }
    });
}

async function screenshare() {
    return new Promise(async (gotstream) => {
        var src = await sharePrompt();
        gotstream(src);
    });
}

try {
    navigator.mediaDevices.getDisplayMedia = screenshare;
} catch (error) {
    console.log("Failed to inject: navigator.mediaDevices.getDisplayMedia");
}

try {
    // Override navigator.geolocation
    Object.defineProperty(navigator, 'geolocation', {
        value: {
            getCurrentPosition: (success, error, options) => {
                const position = {
                    coords: {
                        latitude: 51.5074,
                        longitude: -0.1278,
                    },
                };
                success(position);
            },
            watchPosition: (success, error, options) => {
                const position = {
                    coords: {
                        latitude: 51.5074,
                        longitude: -0.1278,
                    },
                };
                success(position);

                // Mock continuous updates by invoking the success callback periodically
                const intervalId = setInterval(() => {
                    success(position);
                }, 1000);

                return intervalId;
            },
            clearWatch: (watchId) => {
                clearInterval(watchId);
            },
        },
        writable: false,
        configurable: false,
        enumerable: true,
    });
} catch (error) {
    console.log("Failed to inject: navigator.geolocation");
}

//password autofill
//Stolen from Min browser. source: https://github.com/minbrowser/min/blob/master/js/preload/passwordFill.js

// Tries to find if an element has a specific attribute value that contains at
// least one of the values from 'matches' array.
function checkAttributes(element, attributes, matches) {
    for (const attribute of attributes) {
        const value = element.getAttribute(attribute)
        if (value == null) { continue }
        if (matches.some(match => value.toLowerCase().includes(match))) {
            return true
        }
    }
    return false
}

// Gets all input fields on a page that contain at least one of the provided
// strings in their name attribute.
function getBestInput(names, exclusionNames, types) {
    const allFields = [
        ...(document.querySelectorAll('form input') || []),
        ...(document.querySelectorAll('input') || [])
    ]
    // this list includes duplicates, but we only use the first one we find that matches, so there's no need to dedupe

    for (const field of allFields) {
        // checkAttribute won't work here because type can be a property but not an attribute
        if (!types.includes(field.type)) {
            continue
        }

        // We expect the field to have either 'name', 'formcontrolname' or 'id' attribute
        // that we can use to identify it as a login form input field.
        if (names.length === 0 || checkAttributes(field, ['name', 'formcontrolname', 'id', 'placholder', 'aria-label'], names)) {
            if (!checkAttributes(field, ['name', 'formcontrolname', 'id', 'placeholder', 'aria-label'], exclusionNames) && field.type !== 'hidden') {
                return field
            }
        }
    }
    return null
}

// Shortcut to get username fields from a page.
function getBestUsernameField() {
    return getBestInput(['user', 'name', 'mail', 'login', 'auth', 'identifier'], ['confirm', 'filename'], ['text', 'email'])
}

// Shortcut to get password fields from a page.
function getBestPasswordField() {
    return getBestInput([], [], ['password'])
}

//this part is my beautiful shitty code
//who the f*ck reads these anyway?

function showSavePasswordDialog() {
    return new Promise((resolved) => {

        const mainElement = document.createElement("div");
        mainElement.style.display = "block";
        mainElement.style.top = "0px";
        mainElement.style.left = "0px";
        mainElement.style.width = "100%";
        mainElement.style.height = "100%";
        mainElement.style.backgroundColor = "rgba(0, 0, 0, 0.64)";
        mainElement.style.backdropFilter = "blur(4px)";
        mainElement.style.zIndex = "99999999";
        mainElement.style.position = "fixed";
        mainElement.style.userSelect = "none";

        const dialogElement = document.createElement("div");
        dialogElement.style.display = "block";
        dialogElement.style.width = "400px";
        dialogElement.style.height = "300px";
        dialogElement.style.left = "calc(50% - 200px)";
        dialogElement.style.bottom = "20px";
        dialogElement.style.borderRadius = "10px";
        dialogElement.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
        dialogElement.style.position = "absolute";
        dialogElement.style.color = "white";
        dialogElement.style.textAlign = "center";

        mainElement.appendChild(dialogElement);
        document.body.appendChild(mainElement);

        const questionElement = document.createElement("div");
        questionElement.style.display = "block";
        questionElement.style.position = "absolute";
        questionElement.style.top = "0px"
        questionElement.style.left = "0px";
        questionElement.style.width = "100%"
        questionElement.style.height = "80px";
        questionElement.style.lineHeight = "40px";
        questionElement.innerHTML = "Do you want to save the credentials for this site?"
        questionElement.innerHTML += "<br><b>" + location.host + "</b>";
        dialogElement.appendChild(questionElement);

        const okButton = document.createElement("div");
        okButton.style.position = "absolute";
        okButton.style.left = "0px";
        okButton.style.bottom = "0px";
        okButton.style.height = "40px";
        okButton.style.width = "200px";
        okButton.style.backgroundColor = "rgba(34, 34, 34, 1)";
        okButton.addEventListener("mouseenter", () => { okButton.style.background = "rgba(59, 59, 59, 1)" });
        okButton.addEventListener("mouseleave", () => { okButton.style.background = "rgba(34, 34, 34, 1)" })
        okButton.style.transition = "200ms";
        okButton.style.lineHeight = "40px";
        okButton.style.textAlign = "center";
        okButton.innerHTML = "Yes";
        dialogElement.appendChild(okButton);


        const cancelButton = document.createElement("div");
        cancelButton.style.position = "absolute";
        cancelButton.style.left = "200px";
        cancelButton.style.bottom = "0px";
        cancelButton.style.height = "40px";
        cancelButton.style.width = "200px";
        cancelButton.style.backgroundColor = "rgba(34, 34, 34, 1)";
        cancelButton.addEventListener("mouseenter", () => { cancelButton.style.background = "rgba(59, 59, 59, 1)" });
        cancelButton.addEventListener("mouseleave", () => { cancelButton.style.background = "rgba(34, 34, 34, 1)" })
        cancelButton.style.transition = "200ms";
        cancelButton.style.lineHeight = "40px";
        cancelButton.style.textAlign = "center";
        cancelButton.innerHTML = "No"
        dialogElement.appendChild(cancelButton);


        okButton.onclick = () => {
            mainElement.remove();
            resolved(true);
        }

        cancelButton.onclick = () => {
            mainElement.remove();
            resolved(false);
        }

    });
}

function showPasswordFillDialog(options = []) {
    return new Promise((resolved) => {

        const mainElement = document.createElement("div");
        mainElement.style.display = "block";
        mainElement.style.top = "0px";
        mainElement.style.left = "0px";
        mainElement.style.width = "100%";
        mainElement.style.height = "100%";
        mainElement.style.backgroundColor = "rgba(0, 0, 0, 0.64)";
        mainElement.style.backdropFilter = "blur(4px)";
        mainElement.style.zIndex = "99999999";
        mainElement.style.position = "fixed";
        mainElement.style.userSelect = "none";

        const dialogElement = document.createElement("div");
        dialogElement.style.display = "block";
        dialogElement.style.width = "400px";
        dialogElement.style.height = "300px";
        dialogElement.style.left = "calc(50% - 200px)";
        dialogElement.style.bottom = "20px";
        dialogElement.style.borderRadius = "10px";
        dialogElement.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
        dialogElement.style.position = "absolute";
        dialogElement.style.color = "white";
        dialogElement.style.textAlign = "center";
        dialogElement.style.overflowY = "auto";
        mainElement.appendChild(dialogElement);
        document.body.appendChild(mainElement);
        let addElement = (index) => {
            let element = document.createElement("div");
            element.style.position = "relative";
            element.style.float = "left";
            element.style.width = "100%";
            element.style.height = "40px";
            element.style.lineHeight = "40px";
            element.style.textAlign = "center";
            element.style.background = "rgba(34, 34, 34, 1)";
            element.addEventListener("mouseenter", () => { element.style.background = "rgba(59, 59, 59, 1)" });
            element.addEventListener("mouseleave", () => { element.style.background = "rgba(34, 34, 34, 1)" })
            dialogElement.appendChild(element);
            element.addEventListener("click", () => {
                resolved(index);
                mainElement.remove();
            });
            element.innerHTML = options[index]["username"];
        }

        for (let i in options) {
            addElement(i);
        }

    });
}

document.addEventListener("DOMContentLoaded", () => {
    const usernamefield = getBestUsernameField();
    const passwordfield = getBestPasswordField();

    usernamefield.addEventListener("click", async (e) => {
        console.log("Focus: " + usernamefield);
        let passwords = ipcRenderer.sendSync("getPasswordsForSite", location.host);
        console.log(passwords);
        if (passwords.length == 1) {
            usernamefield.value = passwords[0]["username"];
            passwordfield.value = passwords[0]["password"];
            return;
        }

        if (passwords.length > 1) {
            let index = await showPasswordFillDialog(passwords);
            usernamefield.value = passwords[index]["username"];
            passwordfield.value = passwords[index]["password"];

        }
    })

    let isSubmitted = false;
    window.addEventListener('submit', (e) => {
        if (isSubmitted == true) {
            return;
        }
        isSubmitted = true;
        e.preventDefault();
        handleFormSubmit(() => {
            e.submitter.click();
        });
    });

    let handleFormSubmit = async (callback) => {
        let savedState = ipcRenderer.sendSync("isPasswordSaved", {username: usernamefield.value, password: passwordfield.value, site: location.host});
        console.log(savedState);
        if (savedState == "saved") {
            callback();
            return;
        }
        let shouldSave = await showSavePasswordDialog(callback);
        if (shouldSave == false) {
            callback();
            return;
        } else {
            //send save request to password manager provider
            ipcRenderer.send("password-save", { username: usernamefield.value, password: passwordfield.value, site: location.host });
            callback();
        }
    }
})