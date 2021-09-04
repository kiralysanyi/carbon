function showLoader() {
    document.getElementById("loader").style.display = "block";
}

function hideLoader() {
    document.getElementById("loader").style.display = "none";
}

function transformScroll(event) {
    if (!event.deltaY) {
        return;
    }

    event.currentTarget.scrollLeft += event.deltaY + event.deltaX;
    event.preventDefault();
}

document.getElementById("tab_bar").addEventListener("wheel", transformScroll)

newTab();

var urlbar = document.getElementById("urlbar");