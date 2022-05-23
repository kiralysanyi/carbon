const sidebar = document.getElementById("sidebar");
const sidebar_open = document.getElementById("sidebar_open");
const sidebar_back = document.getElementById("sidebar_back");
var sidebar_state = 0;

sidebar_open.onclick = () => {
    if (sidebar_state == 0) {
        sidebar_state = 1;
        sidebar.style.left = "0px";
        sidebar_open.style.left = "260px";
        sidebar_back.style.display = "block";
    }
    else {
        sidebar_state = 0
        sidebar.style.left = "-300px";
        sidebar_open.style.left = "0px";
        sidebar_back.style.display = "none";
    }
}

sidebar_back.onclick = () => {
    sidebar_state = 0
    sidebar.style.left = "-300px";
    sidebar_open.style.left = "0px";
    sidebar_back.style.display = "none";
}

document.getElementById("version_indicator").innerHTML = "Version: " + carbonAPI.getVersion();

//setting up searchform
var searchform = document.getElementById("searchform");
var searchbox = document.getElementById("searchbox");

searchform.addEventListener("submit", (e) => {
    e.preventDefault();
    location.href = carbonAPI.getSearchString() + searchbox.value;
})

searchbox.placeholder = "Search on " + carbonAPI.getSearchEngine();

var isAutoCompleteEnabled = false;

const autocomplete_box = document.getElementById("autocomplete_box");

function showBox() {
    autocomplete_box.style.display = "block";
}

function hideBox() {
    autocomplete_box.style.display = "none";
}

searchbox.addEventListener("focus", () => {
    showBox();
})

searchbox.addEventListener("blur", () => {
    setTimeout(() => {
        hideBox();
    }, 200);
})

//request handler
function sendRequest(url, callback) {
    var req = new XMLHttpRequest();
    req.onload = () => {
        console.log(JSON.parse(req.responseText));
        if (callback) {
            callback(JSON.parse(req.responseText));
        }
    }
    req.open("GET", url);
    req.send();
}

//autocomplete (suggest)
const query_strings = {
    duckduckgo: "https://ac.duckduckgo.com/ac/?q=",
    google: "https://suggestqueries.google.com/complete/search?client=firefox&q="
}

//duckduckgo search suggestions
if (carbonAPI.getSearchEngine() == "duckduckgo") {
    function check() {
        sendRequest(query_strings.duckduckgo + searchbox.value, (result) => {
            autocomplete_box.innerHTML = "";

            if (result.length < 6) {
                autocomplete_box.style.height = 50 * result.length + "px";
            }
            else {
                autocomplete_box.style.height = 50 * 5 + "px";
            }

            for (var x in result) {
                (() => {
                    var phrase = result[x]["phrase"];
                    var element = document.createElement("div");
                    element.innerHTML = phrase;
                    autocomplete_box.appendChild(element)
                    element.setAttribute("phrase", phrase);
                    element.onclick = () => {
                        console.log("Redirecting: ", carbonAPI.getSearchString() + phrase);
                        location.href = carbonAPI.getSearchString() + phrase;
                    }
                })()
            }
        })
    }
    isAutoCompleteEnabled = true;
    if (isAutoCompleteEnabled) {
        setTimeout(() => {
            check();
        }, 100);
    }

    searchbox.addEventListener("focus", () => {
        if (isAutoCompleteEnabled) {
            check();
        }
    })

    document.addEventListener("keydown", () => {
        if (isAutoCompleteEnabled) {
            setTimeout(() => {
                check();
            }, 100);
        }
    })
}


//google search suggestions
if (carbonAPI.getSearchEngine() == "google") {
    function check() {
        if (searchbox.value == "") {
            autocomplete_box.style.height = "0px";
            autocomplete_box.innerHTML = "";
            return;
        }
        sendRequest(query_strings.google + searchbox.value, (result) => {
            var results = result[1];
            autocomplete_box.innerHTML = "";
            if (results.length < 6) {
                autocomplete_box.style.height = 50 * results.length + "px";
            }
            else {
                autocomplete_box.style.height = 50 * 5 + "px";
            }

            for (var x in results) {
                (() => {
                    var phrase = results[x]
                    var element = document.createElement("div");
                    element.innerHTML = phrase;
                    autocomplete_box.appendChild(element)
                    element.setAttribute("phrase", phrase);
                    element.onclick = () => {
                        console.log("Redirecting: ", carbonAPI.getSearchString() + phrase);
                        location.href = carbonAPI.getSearchString() + phrase;
                    }
                })()
            }
        })
    }

    isAutoCompleteEnabled = true;
    document.addEventListener("keydown", () => {
        if (isAutoCompleteEnabled) {
            setTimeout(() => {
                check();
            }, 100);
        }
    })

    searchbox.addEventListener("focus", () => {
        if (isAutoCompleteEnabled) {
            check();
        }
    })
}

//enable autocomplete if supported
function enableAutocomplete() {
    if (carbonAPI.getSearchEngine() != "google" && carbonAPI.getSearchEngine() != "duckduckgo") {
        return;
    }

    isAutoCompleteEnabled = true;
}

//disable autocomplete
function disableAutocomplete() {
    isAutoCompleteEnabled = false;
    setTimeout(() => {
        autocomplete_box.innerHTML = "";
    }, 100);
}

if (carbonAPI.getSearchEngine() == "bing") {
    autocomplete_box.style.height = "50px";
    var message = document.createElement("a");
    autocomplete_box.appendChild(message);
    message.style.lineHeight = "50px";
    autocomplete_box.style.textAlign = "center";
    message.style.color = "white";
    message.innerHTML = "Autocomplete not supported with bing";
}

const historyDOM = document.getElementById("history");

class historyItem {
    constructor(title, url, iconURL) {
        this.title = title;
        this.url = url;
        this.iconURL = iconURL;
        this.htmlObj = document.createElement("div");
        this.htmlObj.classList.add("history_element");
        historyDOM.appendChild(this.htmlObj);
        this.titleDOM = document.createElement("div");
        this.titleDOM.innerHTML = this.title;
        this.iconDOM = document.createElement("img");
        this.iconDOM.src = this.iconURL;
        this.htmlObj.appendChild(this.iconDOM);
        this.htmlObj.appendChild(this.titleDOM);
        this.htmlObj.onclick = () => {
            location.href = this.url;
        }
    }
}

carbonAPI.getHistory().then((data) => {
    console.log(data);
    if (Object.keys(data).length == 0) {
        document.getElementById("clearHistory").style.display = "none";
    }
    for (var x in data) {
        var object = data[x];
        new historyItem(object.title, object.url, object.iconURL);
    }
});

if (!localStorage.getItem("background")) {
    localStorage.setItem("background", "random")
}

if (localStorage.getItem("background") == "random") {
    document.body.style.backgroundImage = 'url("https://picsum.photos/1920/1080")'
} else {
    document.body.style.backgroundImage = "url('" + localStorage.getItem("background").replace(/(\r\n|\n|\r)/gm, "") + "')"
}

function showSettings() {
    const settings_element = document.getElementById("settings");
    settings_element.style.display = "block";
    setTimeout(() => {
        settings_element.style.height = "100%";
    }, 10);
}

function hideSettings() {
    const settings_element = document.getElementById("settings");
    settings_element.style.height = "0%";
    setTimeout(() => {
        settings_element.style.display = "none";
        location.reload();
    }, 200);
}

const background_tab = new tab("Background");
background_tab.focus();
const back_select = new select();
back_select.addOption("Random", "random");
back_select.addOption("Custom", "custom")
back_select.mainObj.id = "selector";
const custom_input = document.createElement("input")
custom_input.type = "file";
custom_input.style.display = "none";
custom_input.accept = "image/png, image/jpeg";


custom_input.addEventListener("change", (e) => {
    background_image_preview.src = custom_input.files[0].path
    var reader = new FileReader();
    reader.onloadend = function() {
        localStorage.setItem("background", reader.result)
    }
    reader.readAsDataURL(custom_input.files[0]);
})

back_select.onchange = () => {
    if (back_select.value == "custom") {
        custom_input.click();
    } else {
        localStorage.setItem("background", "random")
    }
}

var background_image_preview = document.createElement("img")
background_image_preview.id = "image_preview";
background_tab.container.appendChild(background_image_preview);
background_tab.container.appendChild(back_select.mainObj);

if (localStorage.getItem("background") == "random") {
    back_select.setValue("random");
} else {
    back_select.setValue("custom");
}

if (localStorage.getItem("background") == "random") {
    background_image_preview.src = "https://picsum.photos/1920/1080";
} else {
    background_image_preview.src = localStorage.getItem("background");
}