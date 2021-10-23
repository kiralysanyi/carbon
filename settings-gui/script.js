const settings = require("../settings");

function showLoader() {
    document.getElementById("loader").style.display = "block";
}

function hideLoader() {
    document.getElementById("loader").style.display = "none";
}

var general_tab = new tab("General");
var permission_tab = new tab("Permissions");

general_tab.focus();

//setting up general page
var general_title = document.createElement("h1");
general_title.innerHTML = "General"
general_tab.container.appendChild(general_title);

//setting up permissions page

function refresh() {
    permission_container.innerHTML = "";
    showLoader();
    var data = settings.readData("permissions.conf.json")
    if (data == false) {
        console.log("No permission config file found");
        hideLoader();
        return;
    }
    else {
        var permissions = JSON.parse(data);
        console.log("Loaded permission config");
        for (var x in permissions) {
            var index = document.createElement("div");
            index.classList.add("menuitem");
            index.innerHTML = "<a>" + x + "</a>";
            permission_container.appendChild(index);
            for(var y in permissions[x]) {
                (() => {
                    var host = x;
                    var perm = y;
                    var sub_data = document.createElement("div");
                    sub_data.classList.add("submenuitem");
                    sub_data.innerHTML = "<a>" + y + "<a>"
                    permission_container.appendChild(sub_data);
    
                    var selector = document.createElement("select");
                    var option1 = document.createElement("option");
                    var option2 = document.createElement("option");
                    option1.innerHTML = "Denied";
                    option1.value = false;
                    option2.innerHTML = "Allowed";
                    option2.value = true;
                    selector.appendChild(option1);
                    selector.appendChild(option2);
    
                    selector.value = permissions[host][perm];
    
                    selector.onchange = () => {
                        var data = selector.value;
                        if (data == "true") {
                            data = true;
                        }
                        else {
                            data = false;
                        }
                        permissions[host][perm] = data;
                        console.log(permissions, host, perm);
                        settings.saveData("permissions.conf.json", JSON.stringify(permissions));
                    }
    
                    sub_data.appendChild(selector);
                })()
            }
        }
    }

    setTimeout(() => {
        hideLoader();
    }, 2000);
}

var permissions_title = document.createElement("h1");
var permissions_subtitle = document.createElement("a");
permissions_title.innerHTML = "Permission manager";
permissions_subtitle.innerHTML = "You may need to reload the pages for apply changes";

permission_tab.container.appendChild(permissions_title);
permission_tab.container.appendChild(permissions_subtitle);

var permission_container = document.createElement("div");
permission_container.id = "pcontainer"
var refresh_button = document.createElement("button");
refresh_button.innerHTML = "Refresh";
refresh_button.id = "refresh_button";
refresh_button.onclick = refresh;
permission_tab.container.appendChild(refresh_button);

permission_tab.container.appendChild(permission_container);

refresh();