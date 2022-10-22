const fs = require("fs");
const { exec, execSync } = require("child_process");


exports.default = async () => {
    if (fs.existsSync("./dist/win-unpacked")) {
        console.log("Signing windows package");
        try {
            execSync("python -m castlabs_evs.vmp sign-pkg --persistent ./dist/win-unpacked");
        } catch (error) {
            execSync("python3 -m castlabs_evs.vmp sign-pkg --persistent ./dist/win-unpacked");
        }
        console.log("Package signed.")
    } else {
        console.log("Windows package signing skipped");
    }

    if (fs.existsSync("./dist/mac")) {
        console.log("Signing macOS package");
        execSync("python3 -m castlabs_evs.vmp sign-pkg --persistent ./dist/mac");
        console.log("Package signed.")
    } else {
        console.log("macOS package signing skipped");
    }
}
