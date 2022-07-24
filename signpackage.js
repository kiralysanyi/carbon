const fs = require("fs");
const { exec, execSync } = require("child_process");


exports.default = async () => {
    if (fs.existsSync("./dist/win-unpacked")) {
        console.log("Signing windows package");
        execSync("python -m castlabs_evs.vmp sign-pkg --persistent ./dist/win-unpacked");
        console.log("Package signed.")
    } else {
        console.log("Windows package signing skipped");
    }
}
