const fs = require("fs");
const homedir = require("os").homedir();
const confdir = homedir + "/carbon"

function checkDir() {
    if (!fs.existsSync(confdir)) {
        console.log("Config folder not found, creating")
        fs.mkdirSync(confdir);
    }
}

checkDir();

function saveData(filename, data) {
    checkDir();
    fs.writeFileSync(confdir + "/" + filename, data, "utf-8");
}

function readData(filename, defaultvalue = "{}") {
    checkDir();
    if (fs.existsSync(confdir + "/" + filename)) {
        return fs.readFileSync(confdir + "/" + filename, "utf-8");
    }
    else {
        console.log("Error while reading configuration, not existing file: ", filename, " in config directory");
        console.log("Creating file");
        checkDir();
        fs.writeFileSync(confdir + "/" + filename, defaultvalue, "utf-8");
        return fs.readFileSync(confdir + "/" + filename, "utf-8");
    }
}

function readKeyFromFile(filename, key) {
    var data = readData(filename);
    data = JSON.parse(data);
    return data[key];
}

module.exports = {
    saveData: saveData,
    readData: readData,
    readKeyFromFile: readKeyFromFile
}