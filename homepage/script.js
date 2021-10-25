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


searchbox.addEventListener("focus", () => {
    searchform.style.backdropFilter = "blur(4px)";
    searchform.style.backgroundColor = "rgba(34, 34, 34, 0.4)";
    if (isAutoCompleteEnabled == true) {
        document.getElementById("autocomplete_message").style.display = "none";
    }
    else {
        document.getElementById("autocomplete_message").style.display = "block";
    }
    autocomplete_box.style.display = "block";
})

searchbox.addEventListener("blur", () => {
    setTimeout(() => {
        searchform.style.backdropFilter = "none";
        searchform.style.backgroundColor = "transparent";
        document.getElementById("autocomplete_message").style.display = "none";
        autocomplete_box.style.display = "none";
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
}


//google search suggestions
if (carbonAPI.getSearchEngine() == "google") {
    function check() {
        if (searchbox.value == "") {
            autocomplete_box.innerHTML = "";
            return;
        }
        sendRequest(query_strings.google + searchbox.value, (result) => {
            var results = result[1];
            autocomplete_box.innerHTML = "";
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