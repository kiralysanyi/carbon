const { Menu, MenuItem } = require("@electron/remote");

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

window.addEventListener("keydown", (e) => {
    if (e.key == "Enter" && document.activeElement == urlbar) {
        navigate(urlbar.value);
    }
})

//initialize menu
const menu = new Menu();
const menuitems = {
    reload: new MenuItem({
        label: "Reload",
        click: () => {
            console.log("Reload")
            reload();
        }
    }),
    devtools: new MenuItem({
        label: "DevTools",
        click: () => {
            console.log("Devtools")
            openDevTools();
        }
    })

}

menu.append(menuitems.reload);
menu.append(menuitems.devtools);

function openMenu() {
    menu.popup({ x: 80, y: 50 });
}

afterinit = true;