const { ipcRenderer } = require("electron");
let isShown = false;
const winID = ipcRenderer.sendSync("requestWinID");
console.log("Got window id: " + winID);

function showPrompt() {
    document.getElementById("permission_prompt_back").style.display = "block";
    let permission_prompt = document.getElementById("permission_prompt");
    permission_prompt.style.top = "10%";
    permission_prompt.style.transform = "scale(1,1)";
    permission_prompt.style.opacity = 1;
}

function hidePrompt() {
    permission_prompt.style.top = "-20px";
    permission_prompt.style.transform = "scale(0,0)";
    permission_prompt.style.opacity = 0;
    setTimeout(() => {
        document.getElementById("permission_prompt_back").style.display = "none";
    }, 300);
}

function permissionPrompt(permissionName, site) {
    return new Promise((resolved) => {
        isShown = true;
        let permission_question = document.getElementById("permission_question");
        permission_question.innerHTML = "Do you want to grant permission: " + permissionName + " for " + site + "?";
        document.getElementById("permission_allow").onclick = () => {
            console.log("allow");
            if (isShown == true) {
                hidePrompt();
                resolved(true);
            }
        }

        document.getElementById("permission_deny").onclick = () => {
            console.log("deny");

            if (isShown == true) {
                hidePrompt();
                resolved(false);
            }
        }
        showPrompt();
    });
}

ipcRenderer.on("permissionPrompt", async (e, targetWinID, permission, site) => {
    console.log(targetWinID, permission, site);
    if (targetWinID == winID) {
        ipcRenderer.send(permission + winID, await permissionPrompt(permission, site));
    }
});