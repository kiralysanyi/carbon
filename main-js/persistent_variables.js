const settings = require("./settings");

var store = JSON.parse(settings.readData("variables.json", "{}"));

const save = () => {
    settings.saveData("variables.json", JSON.stringify(store))
}

const setVariable = (name, data) => {
    store[name] = data;
    save();
}

const readVariable = (name) => {
    return store[name]
}

module.exports = {
    readVariable,
    setVariable
}