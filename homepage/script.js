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

searchbox.addEventListener("focus", () => {
    searchform.style.backdropFilter = "blur(4px)";
    searchform.style.backgroundColor = "rgba(34, 34, 34, 0.4)";
    document.getElementById("autocomplete_message").style.display = "block";
})

searchbox.addEventListener("blur", () => {
    searchform.style.backdropFilter = "none";
    searchform.style.backgroundColor = "transparent";
    document.getElementById("autocomplete_message").style.display = "none";
})