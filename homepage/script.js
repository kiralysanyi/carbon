//removing blur if needed

function removeBlur(bool) {
    if (bool == true) {
        document.head.innerHTML += '<style id="noblur">body * {backdrop-filter: blur(0px); filter: blur(0px);}</style>'
    } else {
        try {
            document.getElementById("noblur").remove();
        } catch (error) {

        }
    }
}

if (carbonAPI.experimental.isBlurRemoved() == true) {
    removeBlur(true);
}

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
    setTimeout(() => {
        autocomplete_box.style.opacity = 1;
    }, 10);
    searchbox.style.borderBottomLeftRadius = "0px";
    searchbox.style.borderBottomRightRadius = "0px";
}

function hideBox() {
    autocomplete_box.style.opacity = 0;
    setTimeout(() => {
        autocomplete_box.style.display = "none";
        searchbox.style.borderBottomLeftRadius = "30px";
        searchbox.style.borderBottomRightRadius = "30px";
    }, 200);
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
const domainIcons = {};

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

        this.iconDOM.onerror = () => {
            this.iconDOM.src = "notfound.png";
        }
        //add icon to domainIcons
        let domain = new URL(this.url).host;
        domainIcons[domain] = this.iconURL;

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

function lightenColor(red, green, blue, percent) {
    // Calculate the lightness increase
    const amount = Math.round(255 * (percent / 100));

    // Increase the color channels
    red = Math.min(red + amount, 255);
    green = Math.min(green + amount, 255);
    blue = Math.min(blue + amount, 255);

    // Return the modified color as an RGB string
    return [red, green, blue];
}

const startTheming = async () => {
    var color;
    if (localStorage.getItem("background") == "random") {
        color = await colorThief.getColor(image_string)
    } else {
        color = await colorThief.getColor(localStorage.getItem("background"))
    }
    console.log(color)

    if (carbonAPI.getTheme() == "light") {
        hex = rgbToHex(color[0], color[1], color[2])
        if (carbonAPI.experimental.wc_hex_is_light(hex) == false) {
            color = lightenColor(color[0], color[1], color[2], 50);
            console.log(color);
        }
    }

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
        document.getElementById("settings_open").style.color = "black";
        document.getElementById("history_toggle").style.color = "black";
        document.getElementById("history_header").style.color = "black";
        document.getElementById("history_close").style.color = "black";
    } else {
        searchbox.style.color = "white"
        autocomplete_box.style.color = "white";
        historyDOM.style.color = "white";
        document.getElementById("history_header").style.color = "white";
        document.getElementById("settings_open").style.color = "white";
        document.getElementById("history_toggle").style.color = "white";
        document.getElementById("history_close").style.color = "white";
    }

    document.getElementById("settings_open").style.backgroundColor = backgroundHEX;
    document.getElementById("history_toggle").style.backgroundColor = backgroundHEX;
    document.getElementById("history_header").style.backgroundColor = backgroundHEX;
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
        settings_element.style.opacity = "1";
        settings_element.style.left = "0px";
    }, 10);
}

function hideSettings() {
    const settings_element = document.getElementById("settings");
    settings_element.style.left = "-20px";
    settings_element.style.opacity = "0";
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

//favorites handling

if (!localStorage.getItem("favorites")) {
    localStorage.setItem("favorites", "{}");
}

var favorites = JSON.parse(localStorage.getItem("favorites"));

function saveFavorites() {
    localStorage.setItem("favorites", JSON.stringify(favorites));
}



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
        image.onerror = () => {
            image.src = "notfound.png";
        }
        element.appendChild(image);
        element.appendChild(title);
        container.appendChild(element);
        element.onclick = () => {
            location.href = obj.url;
        }

        element.oncontextmenu = (e) => {
            e.preventDefault();
            openEditWindow(obj.url);
        }
    }
}

function openAddWindow() {
    document.getElementById("editWindow_title").innerHTML = "Add shortcut";
    document.getElementById("editWindow_delete").innerHTML = "Cancel";
    const editWindow = document.getElementById("editWindow");
    const editWindow_inner = document.getElementById("editWindow_inner");
    const editWindow_url = document.getElementById("editWindow_url");
    const editWindow_name = document.getElementById("editWindow_name");
    editWindow_name.value = "";
    editWindow_url.value = "";
    if (carbonAPI.experimental.isBlurRemoved() == true) {
        editWindow.style.backdropFilter = "blur(0px)";
    }
    editWindow.style.display = "block";
    setTimeout(() => {
        editWindow.style.opacity = 1;
        setTimeout(() => {
            editWindow_inner.style.transform = "scale(1)";
        }, 200);
    }, 50);
    const editWindow_done = document.getElementById("editWindow_done");
    document.getElementById("editWindow_delete").onclick = () => {
        closeEditWindow();
    };
    editWindow_done.onclick = () => {
        let newURL;
        try {
            newURL = new URL(editWindow_url.value);

        } catch (error) {
            closeEditWindow();
            return;
        }
        let favicon_url = "https://s2.googleusercontent.com/s2/favicons?sz=64&domain_url=" + newURL.toString();
        if (domainIcons[newURL.host] != undefined) {
            favicon_url = domainIcons[newURL.host];
        }

        favorites[editWindow_url.value] = {
            favicon_url: favicon_url,
            title: editWindow_name.value,
            url: editWindow_url.value
        };
        closeEditWindow();
        saveFavorites();
        renderFavorites();
    }
}

function openEditWindow(url) {
    document.getElementById("editWindow_title").innerHTML = "Edit shortcut";
    document.getElementById("editWindow_delete").innerHTML = "Delete";
    const editWindow = document.getElementById("editWindow");
    const editWindow_inner = document.getElementById("editWindow_inner");
    const editWindow_url = document.getElementById("editWindow_url");
    const editWindow_name = document.getElementById("editWindow_name");
    if (carbonAPI.experimental.isBlurRemoved() == true) {
        editWindow.style.backdropFilter = "blur(0px)";
    }
    editWindow_url.value = url;
    editWindow_name.value = favorites[url]["title"];
    editWindow.style.display = "block";
    setTimeout(() => {
        editWindow.style.opacity = 1;
        setTimeout(() => {
            editWindow_inner.style.transform = "scale(1)";
        }, 200);
    }, 50);
    const editWindow_done = document.getElementById("editWindow_done");
    document.getElementById("editWindow_delete").onclick = () => {
        delete favorites[url];
        saveFavorites();
        renderFavorites();
        closeEditWindow();
    };
    editWindow_done.onclick = () => {
        if (url == editWindow_url.value && editWindow_name.value == favorites[url].title) {
            closeEditWindow();
            return;
        }
        const newURL = new URL(editWindow_url.value);
        let favicon_url = "https://s2.googleusercontent.com/s2/favicons?sz=64&domain_url=" + newURL.toString();
        if (domainIcons[newURL.host] != undefined) {
            favicon_url = domainIcons[newURL.host];
        }
        delete favorites[url];
        favorites[editWindow_url.value] = {
            favicon_url: favicon_url,
            title: editWindow_name.value,
            url: editWindow_url.value
        };
        closeEditWindow();
        saveFavorites();
        renderFavorites();
    }
}

function closeEditWindow() {
    const editWindow = document.getElementById("editWindow");
    const editWindow_inner = document.getElementById("editWindow_inner");
    setTimeout(() => {
        editWindow.style.opacity = 0;
        editWindow_inner.style.transform = "scale(0)";
        setTimeout(() => {
            editWindow.style.display = "none";
        }, 200);
    }, 50);
}

setTimeout(() => {
    renderFavorites();
}, 1000)

async function addFavorite() {
    openAddWindow();
}

var historyDisplayState = false;
const history_container = document.getElementById("history_container");

function showHistory() {
    historyDisplayState = true;
    history_container.style.display = "block";
    setTimeout(() => {
        history_container.style.left = "0px";
        history_container.style.opacity = "1";
    }, 20);
}

document.getElementById("history_close").addEventListener("click", () => {
    hideHistory();
})

function hideHistory() {
    historyDisplayState = false;
    history_container.style.left = "-20px";
    history_container.style.opacity = "0";
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

//apply theme
function applyTheme(theme) {
    if (theme == "light") {
        var head = document.getElementsByTagName('head')[0];

        // Creating link element
        var style = document.createElement('link');
        style.id = "lightthemecss"
        style.href = 'light.css'
        style.type = 'text/css'
        style.rel = 'stylesheet'
        head.append(style);
    } else {
        try {
            document.getElementById("lightthemecss").remove();
        } catch (error) {
            console.log("Light theme not loaded. I'm doing nothing.");
        }
    }
}

applyTheme(carbonAPI.getTheme());

//update clock

setInterval(() => {
    let d = new Date();
    document.getElementById("clock").innerHTML = d.getHours() + ":" + d.getMinutes();
}, 1000);

//weather info
const weather_display = document.getElementById("weather_display");
const location_display = document.getElementById("location_display");
const temperature_display = document.getElementById("temperature_display");
const weather_hidden_info = document.getElementById("weather_hidden_info");
const weather_hide = document.getElementById("weather_hide");
const changeLocationButton = document.getElementById("changeLocationButton");
let isHiddenInfoShown = false;
weather_hide.addEventListener("click", hideHiddenWeatherInfo);

function showHiddenWeatherInfo() {
    if (isHiddenInfoShown == true) {
        return;
    }
    isHiddenInfoShown = true;
    weather_display.style.top = "0px";
    weather_display.style.left = "0px";
    weather_display.style.width = "100%";
    weather_display.style.height = "100%";
    weather_display.style.borderRadius = "0px";
    weather_hidden_info.style.display = "block";
    location_display.style.width = "50%";
    location_display.style.left = "80px";
    weather_hide.style.display = "block";
    changeLocationButton.style.display = "block";
}

weather_display.addEventListener("click", (e) => {
    if (e.target.id == "hideicon" || e.target.id == "weather_hide") {
        hideHiddenWeatherInfo();
        return;
    }
    showHiddenWeatherInfo();
})

function hideHiddenWeatherInfo() {
    if (isHiddenInfoShown == false) {
        return;
    }
    isHiddenInfoShown = false;
    weather_display.style.top = "20px";
    weather_display.style.left = "20px";
    weather_display.style.width = "200px";
    weather_display.style.height = "70px";
    weather_display.style.borderRadius = "20px";
    weather_hidden_info.style.display = "none";
    location_display.style.width = "140px";
    weather_hide.style.display = "none";
    location_display.style.left = "10px";
    changeLocationButton.style.display = "none";
}




function resetWeatherInfo() {
    localStorage.removeItem("weatherInfo");
    localStorage.removeItem("lastWeatherUpdate");
}

function requestWeatherInfo() {
    return new Promise((resolved) => {
        let locationInfo = JSON.parse(localStorage.getItem("locationInfo"));
        console.log(locationInfo);
        let lastUpdateDate;
        if (localStorage.getItem("lastWeatherUpdate") != null) {
            lastUpdateDate = new Date(localStorage.getItem("lastWeatherUpdate"));
        } else {
            lastUpdateDate = new Date(0);
        }

        if (lastUpdateDate.getHours() < new Date().getHours() || lastUpdateDate.getDay() < new Date().getDay()) {
            sendRequest("https://api.open-meteo.com/v1/forecast?latitude=" + locationInfo.lat + "&longitude=" + locationInfo.lon + "&hourly=temperature_2m,precipitation,surface_pressure,cloudcover,visibility,windspeed_10m,uv_index&forecast_days=3&timezone=auto", (data) => {
                localStorage.setItem("lastWeatherUpdate", new Date().toISOString());
                localStorage.setItem("weatherInfo", JSON.stringify(data));
                document.getElementById("lastUpdated").innerHTML = "Last updated: " + new Date(localStorage.getItem("lastWeatherUpdate")).toLocaleString();
                resolved(data);
            });
        } else {
            resolved(JSON.parse(localStorage.getItem("weatherInfo")));
        }
    });
}

let tempChart, precipitationChart, surface_pressureChart, windspeedChart, uvindexChart, cloudcoverChart, visibilityChart;
function forceWeatherUpdate() {
    resetWeatherInfo();
    setTimeout(() => {
        tempChart.destroy();
        surface_pressureChart.destroy();
        precipitationChart.destroy();
        windspeedChart.destroy();
        uvindexChart.destroy();
        cloudcoverChart.destroy();
        visibilityChart.destroy();
        fillInfo();
    }, 200);
}
Chart.defaults.global.defaultFontColor = "#fff";
if (carbonAPI.getTheme() == "light") {
    Chart.defaults.global.defaultFontColor = "#000"; 
}
async function fillInfo() {
    //current temperature
    let locationInfo = JSON.parse(localStorage.getItem("locationInfo"));

    const currentDate = new Date();
    let info = await requestWeatherInfo();
    for (let x in info["hourly"]["visibility"]) {
        info["hourly"]["visibility"][x] /= 1000;
    }
    for (let x in info["hourly"]["time"]) {
        let d = new Date(info["hourly"]["time"][x]);
        if (d.getHours() == currentDate.getHours() && d.getDay() == currentDate.getDay()) {
            temperature_display.innerHTML = Math.floor(info["hourly"]["temperature_2m"][x]) + info["hourly_units"]["temperature_2m"];
            location_display.innerHTML = locationInfo.city;
            document.getElementById("currentPrecipitation").innerHTML = "Current: " + info["hourly"]["precipitation"][x] + "mm";
            document.getElementById("currentSurface_pressure").innerHTML = "Current: " + info["hourly"]["surface_pressure"][x] + "hPa";
            document.getElementById("currentWindspeed").innerHTML = "Current: " + info["hourly"]["windspeed_10m"][x] + "km/h";
            document.getElementById("currentUvindex").innerHTML = "Current: " + info["hourly"]["uv_index"][x];
            document.getElementById("currentCloudcover").innerHTML = "Current: " + info["hourly"]["cloudcover"][x] + "%";
            document.getElementById("currentVisibility").innerHTML = "Current: " + info["hourly"]["visibility"][x] + "KM";
            console.log(x);
        }
    }

    //chart
    tempChart = new Chart("tempChart", {
        type: "line",
        data: {
            labels: info["hourly"]["time"],
            datasets: [{
                label: "Temperature in Celsius",
                backgroundColor: "rgba(0,0,255,1.0)",
                color: "white",
                borderColor: "rgba(0,0,255,0.1)",
                data: info["hourly"]["temperature_2m"]
            }]
        },

    });

    //precipitation
    precipitationChart = new Chart("precipitationChart", {
        type: "line",
        data: {
            labels: info["hourly"]["time"],
            datasets: [{
                label: "precipitation in mm",
                backgroundColor: "rgba(0,0,255,1.0)",
                color: "white",
                borderColor: "rgba(0,0,255,0.1)",
                data: info["hourly"]["precipitation"]
            }]
        },

    });

    //surface pressure
    surface_pressureChart = new Chart("surface_pressureChart", {
        type: "line",
        data: {
            labels: info["hourly"]["time"],
            datasets: [{
                label: "Surface pressure in hPa",
                backgroundColor: "rgba(0,0,255,1.0)",
                color: "white",
                borderColor: "rgba(0,0,255,0.1)",
                data: info["hourly"]["surface_pressure"]
            }]
        },

    });

    //windspeed
    windspeedChart = new Chart("windspeedChart", {
        type: "line",
        data: {
            labels: info["hourly"]["time"],
            datasets: [{
                label: "Wind speed in km/h",
                backgroundColor: "rgba(0,0,255,1.0)",
                color: "white",
                borderColor: "rgba(0,0,255,0.1)",
                data: info["hourly"]["windspeed_10m"]
            }]
        },

    });

    //uv index
    uvindexChart = new Chart("uvindexChart", {
        type: "line",
        data: {
            labels: info["hourly"]["time"],
            datasets: [{
                label: "UV index",
                backgroundColor: "rgba(0,0,255,1.0)",
                color: "white",
                borderColor: "rgba(0,0,255,0.1)",
                data: info["hourly"]["uv_index"]
            }]
        },

    });

    //cloud coverage
    cloudcoverChart = new Chart("cloudcoverChart", {
        type: "line",
        data: {
            labels: info["hourly"]["time"],
            datasets: [{
                label: "Cloud coverage in %",
                backgroundColor: "rgba(0,0,255,1.0)",
                color: "white",
                borderColor: "rgba(0,0,255,0.1)",
                data: info["hourly"]["cloudcover"]
            }]
        },

    });

    //visibility
    visibilityChart = new Chart("visibilityChart", {
        type: "line",
        data: {
            labels: info["hourly"]["time"],
            datasets: [{
                label: "Visibility in KM",
                backgroundColor: "rgba(0,0,255,1.0)",
                color: "white",
                borderColor: "rgba(0,0,255,0.1)",
                data: info["hourly"]["visibility"]
            }]
        },

    });
}

if (localStorage.getItem("locationInfo") == null) {
    localStorage.setItem("locationInfo", JSON.stringify({
        city: "Budapest",
        lon: 19.04045,
        lat: 47.49835
    }))
}

fillInfo();



document.getElementById("searchCancelButton").onclick = () => {
    document.getElementById("changeLocationForm").style.display = "none";
}

function searchLocation(cityname) {
    return new Promise((resolved) => {
        const url = new URL("https://geocoding-api.open-meteo.com/v1/search?name=" + cityname + "&count=10&language=en&format=json").toString();
        sendRequest(url, (data) => {
            console.log(data);
            resolved(data["results"]);
        })
    });

}

document.getElementById("citySearchButton").onclick = async () => {
    let cityname = document.getElementById("cityNameInput").value;
    let data = await searchLocation(cityname);
    let citySearchResults = document.getElementById("citySearchResults");
    citySearchResults.innerHTML = "";
    for (let x in data) {
        let item = document.createElement("div");
        item.innerHTML = data[x]["name"] + ", " + data[x]["country"];
        item.onclick = () => {
            console.log(data[x]);
            localStorage.setItem("locationInfo", JSON.stringify({
                city: data[x]["name"],
                lon: data[x]["longitude"],
                lat: data[x]["latitude"]
            }));
            forceWeatherUpdate();
            document.getElementById("changeLocationForm").style.display = "none";
        }
        citySearchResults.appendChild(item);
    }
}

changeLocationButton.onclick = () => {
    document.getElementById("changeLocationForm").style.display = "block";
}