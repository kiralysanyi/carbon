const { readFileSync } = require("original-fs");
const settings = require("./settings");

var package_data = readFileSync("./package.json", "utf-8");
package_data = JSON.parse(package_data)


//initializing general config file
var config = JSON.parse(settings.readData("general.conf.json"));
if (Object.keys(config).length == 0) {
    //default config
    config["versionindex"] = package_data["version_index"];
    config["adblock"] = false;
    config["searchEngine"] = "duckduckgo";
    config["homePage"] = "default";
    config["update-channel"] = "stable";
    config["auto-update"] = true;
    settings.saveData("general.conf.json", JSON.stringify(config));
    first_startup = true;
}

if (config["versionindex"] == null) {
    config["versionindex"] = package_data["version_index"];
}

console.log("Application version index: ", package_data["version_index"])
console.log(config["versionindex"])
if (config["versionindex"] < package_data["version_index"]) {
    console.log("Upgrade detected");

    //enable auto updates below version index 2
    if (config["versionindex"] < 4) {
        console.log("Enabling auto update");
        config["auto-update"] = true;
        settings.saveData("general.conf.json", JSON.stringify(config));
    }

    config["versionindex"] = package_data["version_index"]
    settings.saveData("general.conf.json", JSON.stringify(config));
}

//initializing experimental config file
var config_exp = settings.readData("experimental.conf.json");
console.log("Configuration read: ", config_exp);
if (config_exp == "{}") {
    config_exp = {};
    settings.saveData("experimental.conf.json", JSON.stringify(config_exp));
    //default config
    config_exp["immersive_interface"] = false;
    settings.saveData("experimental.conf.json", JSON.stringify(config_exp));
}

//initializing download history

var dlhistory = settings.readData("download.history.json");
console.log("Download history read");
if (dlhistory == "{}") {
    dlhistory = {};
    settings.saveData("download.history.json", JSON.stringify(dlhistory));
}

module.exports = {
    config,
    config_exp,
    dlhistory,
    package_data
}