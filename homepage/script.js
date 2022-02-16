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
            
            if(result.length < 6) {
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
            if(results.length < 6) {
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

if(carbonAPI.getSearchEngine() == "bing") {
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
    for (var x in data) {
        var object = data[x];
        new historyItem(object.title, object.url, object.iconURL);
    }
});

if (carbonAPI.experimental.isBlurEnabled() == true) {
    document.body.style.background = "none";
}