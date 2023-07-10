const fs = require("fs");
const { ipcMain, app, BrowserWindow } = require("electron");
const prompt = require("./prompt");

let Blowfish;
import("egoroof-blowfish/dist/blowfish.mjs").then((mod) => {
    Blowfish = mod.Blowfish;
}).catch((error) => {
    console.log("Failed to import blowfish module");
    console.log(error);
    process.exit();
});
let bf;
let isUnlocked = false;

const homedir = require("os").homedir();
const confdir = homedir + "/.carbon";
const filepath = confdir + "/passwd.json";
if (fs.existsSync(filepath) == false) {
    fs.writeFileSync(filepath, JSON.stringify({ passhash: null, passwords: {} }), { encoding: "utf-8" });
}

const bcrypt = require('bcrypt');
const { passwordPrompt } = require("./prompt");
const saltRounds = 10;

const encrypt = (text) => {
    return bf.encode(text);
}

const decrypt = (text) => {
    return bf.decode(text, Blowfish.TYPE.STRING);
}

let passwdjson = JSON.parse(fs.readFileSync(filepath, { encoding: "utf-8" }));

console.log("Converting saved passwords to uint8array");
for (let x in passwdjson["passwords"]) {
    for (let i in passwdjson["passwords"][x]) {
        let array = [];
        for (let iHateMyLifexD in passwdjson["passwords"][x][i]["password"]) {
            array.push(passwdjson["passwords"][x][i]["password"][iHateMyLifexD]);
        }
        passwdjson["passwords"][x][i]["password"] = new Uint8Array(array);
    }
}

function writeFile() {
    fs.writeFileSync(filepath, JSON.stringify(passwdjson), { encoding: "utf-8" });
}

function setUnlockPassword(password) {
    return new Promise((resolved) => {
        bcrypt.hash(password, saltRounds, (err, hash) => {
            passwdjson["passhash"] = hash;
            writeFile();
            resolved();
        })
    });
}


let masterpassword = null;
app.whenReady().then(async () => {
    let unlock = async () => {
        masterpassword = await prompt.passwordPrompt("Password manager unlock");
        if (masterpassword == null) {
            console.log("Password manager unlock aborted");
            return;
        }

        bcrypt.compare(masterpassword, passwdjson["passhash"], async function (err, result) {
            if (result == true) {
                console.log("Password manager unlocked");
                isUnlocked = true;
                bf = new Blowfish(masterpassword, Blowfish.MODE.ECB, Blowfish.PADDING.NULL);
            } else {
                await prompt.alert("Failed to unlock, please try again.");
                unlock();
            }
        });
    }
    console.log("Password manager unlock procedure started");
    if (passwdjson["passhash"] == null) {
        let setup = async () => {
            masterpassword = await prompt.passwordPrompt("New password for password manager");
            let masterpassword2 = await prompt.passwordPrompt("Confirm password");
            if (masterpassword != masterpassword2) {
                await prompt.alert("Passwords are not matching. Please try again.");
                setup();
            } else {
                await setUnlockPassword(masterpassword);
                unlock();
            }
        }
        console.log("Setting up password manager");
        setup();
    } else {
        unlock();
    }

});

ipcMain.on("password-save", (e, data) => {
    if (isUnlocked == false) {
        alert("Password manager locked, password saving is disabled.");
        return;
    };
    console.log("Save password: ", data);
    if (passwdjson["passwords"][data["site"]] == undefined) {
        passwdjson["passwords"][data["site"]] = [];
    }
    let encrypted_password = encrypt(data["password"]);
    console.log(encrypted_password);
    for(let x in passwdjson["passwords"][data["site"]]) {
        if(passwdjson["passwords"][data["site"]][x]["username"] == data["username"]) {
            console.log("Updating password");
            passwdjson["passwords"][data["site"]][x]["password"] = encrypted_password;
            writeFile();
            return;
        }
    }
    passwdjson["passwords"][data["site"]].push({
        username: data["username"],
        password: encrypted_password
    });
    writeFile();
});

ipcMain.on("getPasswordsForSite", (e, site) => {
    console.log(passwdjson["passwords"][site]);
    if (passwdjson["passwords"][site] == undefined) {
        e.returnValue = [];
    } else {
        let passwords = [];
        for (let i in passwdjson["passwords"][site]) {
            passwords.push({ username: passwdjson["passwords"][site][i]["username"], password: decrypt(passwdjson["passwords"][site][i]["password"]) });
        }
        e.returnValue = passwords;
    }
});

//can return 3 values: unsaved, saved, changed
ipcMain.on("isPasswordSaved", (e, data) => {
    for (let x in passwdjson["passwords"][data["site"]]) {
        if (passwdjson["passwords"][data["site"]][x]["username"] == data["username"]) {
            if (decrypt(passwdjson["passwords"][data["site"]][x]["password"]) == data["password"]) {
                e.returnValue = "saved";
                return;
            } else {
                e.returnValue = "changed";
                return;
            }
        }
    }
    e.returnValue = "unsaved";
});