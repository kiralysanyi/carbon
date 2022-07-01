const { ipcRenderer } = require("electron")

function handleClick(element) {
    console.log(element)
    var display_id = element.getAttribute("display_id")
    console.log("Selected: ", display_id)
    setTimeout(() => {
        ipcRenderer.sendSync("source", display_id);
    }, 500);
}

async function init() {
    const sources = ipcRenderer.sendSync("getSources")
    console.log(sources)
    for (var x in sources) {
        console.log(sources[x])
        var thumbnail = sources[x].thumbnail.toDataURL();
        var element = document.createElement("div");
        var a = document.createElement("a");
        a.innerHTML = sources[x].name;
        element.appendChild(a);

        var img = document.createElement("img");
        element.appendChild(img);

        document.body.appendChild(element);
        img.src = thumbnail;
        element.setAttribute("display_id", x);
        console.log("Adding option: ", x)
        element.setAttribute("onclick", "handleClick(this)")
    }
}

ipcRenderer.on("startInit", () => {
    init();
})