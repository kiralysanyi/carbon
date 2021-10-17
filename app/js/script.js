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

//initialize sidebar

var sidebar = document.getElementById("sidebar")
sidebar.style.width = sidebar_width + "px";
sidebar.style.left = "-" + sidebar_width + "px";
var isSidebarOpen = false;

function showSidebar() {
    positionAll({y: 90, x: sidebar_width, width: window.outerWidth, height: window.outerHeight - 90});
    sidebar.style.left = "0px";
    isSidebarOpen = true;
}

function hideSidebar() {
    sidebar.style.left = "-" + sidebar_width + "px";
    setTimeout(() => {
        resizeAll();
        isSidebarOpen = false;
    }, 300);
}

function toggleSidebar() {
    if (focused_tab != null) {
        if (isSidebarOpen == true) {
            hideSidebar();
        }
        else {
            showSidebar();
        }   
    }
}

afterinit = true;