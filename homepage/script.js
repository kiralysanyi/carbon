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

        this.htmlObj.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            this.htmlObj.remove();
            carbonAPI.removeHistoryItem(this.url);
        })
    }
}


function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

const colorThief = carbonAPI.experimental.ColorThief;

var backgroundRGB;
var backgroundHEX;



const startTheming = async () => {
    var color;
    if (localStorage.getItem("background") == "random") {
        color = await colorThief.getColor(image_string)
    } else {
        color = await colorThief.getColor(localStorage.getItem("background"))
    }
    console.log(color)
    hex = rgbToHex(color[0], color[1], color[2])
    console.log(hex)
    backgroundRGB = color;
    backgroundHEX = hex;
    var metaThemeColor = document.querySelector("meta[name=theme-color]");
    metaThemeColor.setAttribute("content", hex);
    searchbox.style.backgroundColor = hex

    if (carbonAPI.experimental.wc_hex_is_light(hex)) {
        searchbox.style.color = "black"
        autocomplete_box.style.color = "black";
        historyDOM.style.color = "black";
    } else {
        searchbox.style.color = "white"
        autocomplete_box.style.color = "white";
        historyDOM.style.color = "white";

    }

    autocomplete_box.style.backgroundColor = "rgba(" + color[0] + ", " + color[1] + ", " + color[2] + ", 0.4)"
    historyDOM.style.backgroundColor = "rgba(" + color[0] + ", " + color[1] + ", " + color[2] + ", 0.4)"
    document.getElementById("favorites").style.backgroundColor = "rgba(" + color[0] + ", " + color[1] + ", " + color[2] + ", 0.6)"
}

function toDataURL(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
        var reader = new FileReader();
        reader.onloadend = function () {
            callback(reader.result);
        }
        reader.readAsDataURL(xhr.response);
    };
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    xhr.send();
}

carbonAPI.getHistory().then((data) => {
    console.log(data);
    if (Object.keys(data).length == 0) {
        document.getElementById("clearHistory").style.display = "none";
        document.getElementById("history_toggle").style.display = "none";
    }
    for (var x in data) {
        var object = data[x];
        new historyItem(object.title, object.url, object.iconURL);
    }
});

if (!localStorage.getItem("background")) {
    localStorage.setItem("background", "random")
}

var image_string;

toDataURL("https://picsum.photos/1920/1080", (string) => {
    image_string = string
    if (localStorage.getItem("background") == "random") {
        document.body.style.backgroundImage = 'url("' + image_string.replace(/(\r\n|\n|\r)/gm, "") + '")'
        startTheming();
    }
})

if (localStorage.getItem("background") != "random") {
    document.body.style.backgroundImage = "url('" + localStorage.getItem("background").replace(/(\r\n|\n|\r)/gm, "") + "')"
    startTheming();
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
    reader.onloadend = function () {
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

//prompt
function prompt(title = "?", placeholder = "") {
    return new Promise((resolved) => {
        const htmlObj = document.createElement("div");
        htmlObj.classList.add("prompt");
        const container = document.createElement("div");
        container.classList.add("prompt_container");
        htmlObj.appendChild(container);

        const title_object = document.createElement("h1");
        title_object.innerHTML = title;
        container.appendChild(title_object);

        const input_object = document.createElement("input");
        input_object.type = "text";
        input_object.placeholder = placeholder;
        container.appendChild(input_object);

        const submit_button = document.createElement("button");
        submit_button.innerHTML = "OK";
        container.appendChild(submit_button);

        submit_button.onclick = () => {
            resolved(input_object.value)
            htmlObj.remove();
        }

        document.body.appendChild(htmlObj);
    })
}


//favorites handling

if (!localStorage.getItem("favorites")) {
    localStorage.setItem("favorites", "{}");
}

var favorites = JSON.parse(localStorage.getItem("favorites"));

function saveFavorites() {
    localStorage.setItem("favorites", JSON.stringify(favorites));
}

document.getElementById("favorites").addEventListener("mouseenter", () => {
    document.getElementById("favorites_hint").style.display = "block";
})

document.getElementById("favorites").addEventListener("mouseleave", () => {
    document.getElementById("favorites_hint").style.display = "none";
})


function renderFavorites() {
    const container = document.getElementById("favorites_container");
    const htmlObj = document.getElementById("favorites");
    htmlObj.style.width = "100px";
    container.innerHTML = "";
    const len = Object.keys(favorites).length;
    var overflow = 0;
    
    if (len >= 6) {
        overflow = len - 5
    }

    console.log(overflow, len)
    const favorites_add = document.getElementById("favorites_add");
    if (len >= 6) {
        htmlObj.style.width = (100 * (len - overflow)) + "px";
        htmlObj.style.height = "200px";
        favorites_add.style.top = "100px";
        container.style.height = "200px";
    } else { 
        htmlObj.style.width = (100 + (100 * len)) + "px";
        htmlObj.style.height = "100px";
        favorites_add.style.top = "0px";
    }

    if (len >= 10) {
        favorites_add.style.display = "none";
    } else {
        favorites_add.style.display = "block";
    }
    var i = 0
    for (var x in favorites) {
        i++;
        if (i == 6) {
            container.appendChild(document.createElement("br"))
        }
        const obj = favorites[x];
        const element = document.createElement("div");
        element.classList.add("button");
        const image = document.createElement("img");
        image.src = obj.favicon_url;
        const title = document.createElement("a");
        title.innerHTML = obj.title;
        element.appendChild(image);
        element.appendChild(title);
        container.appendChild(element);
        element.onclick = () => {
            location.href = obj.url;
        }

        element.oncontextmenu = () => {
            delete favorites[obj.url];
            renderFavorites();
            saveFavorites();
        }
    }
}

setTimeout(() => {
    renderFavorites();
}, 1000)

async function addFavorite() {
    const url = new URL(await prompt("Webpage url", "url"));
    const title = await prompt("Title", "Title")
    const favicon_url = "https://s2.googleusercontent.com/s2/favicons?sz=64&domain_url=" + url.toString()
    var object = {
        "url": url.toString(),
        "favicon_url": favicon_url,
        "title": title
    }

    favorites[url] = object;
    saveFavorites();
    renderFavorites();
}

var historyDisplayState = false;
const history_container = document.getElementById("history_container");

function showHistory() {
    historyDisplayState = true;
    history_container.style.left = "-50%";
    history_container.style.bottom = "-50%";
    history_container.style.display = "block";
    history_container.style.transform = "scale(0,0)";
    setTimeout(() => {
        history_container.style.left = "10%";
        history_container.style.bottom = "0px";
        history_container.style.transform = "scale(1,1)";
    }, 20);
}

function hideHistory() {
    historyDisplayState = false;
    history_container.style.transform = "scale(0,0)";
    setTimeout(() => {
        history_container.style.left = "-50%";
        history_container.style.bottom = "-50%";
    },100);
    setTimeout(() => {
        history_container.style.display = "none"
    }, 600);
}

function toggleHistory() {
    document.getElementById("history_toggle").disabled = true;
    if (historyDisplayState == true) {
        hideHistory();
    } else {
        showHistory();
    }

    setTimeout(() => {
        document.getElementById("history_toggle").disabled = false;
    }, 600);
}