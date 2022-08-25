let timeout = null;
let opened = false;
let t_div = document.createElement("div");
t_div.style.backgroundColor = "white";
t_div.style.width = "calc(100% - 15px)";
t_div.style.height = "calc(100% - 15px)";
t_div.style.left = "5px";
t_div.style.top = "5px";
t_div.style.zIndex = "100000";
t_div.style.display = "none";
t_div.style.border = "5px solid aqua";
t_div.style.position = "fixed";
t_div.style.lineHeight = "100px";
t_div.style.fontSize = "30px";
t_div.style.textAlign = "center";
t_div.innerHTML = "Press and hold Escape for 5 seconds to leave this screen";
document.body.appendChild(t_div);
let isDown = false;
window.addEventListener("keydown", (e) => {
    if (isDown == true) {
        return;
    }
    isDown = true;
    console.log("Keypress: ", e.key)
    if (e.key == "Escape") {
        timeout = setTimeout(() => {
            if (opened == false) {
                t_div.style.display = "block";
                opened = true;
            } else {
                t_div.style.display = "none";
                opened = false;
            }
        }, 5000);
    }
})

window.addEventListener("keyup", (e) => {
    if(e.key == "Escape") {
        isDown = false;
        clearTimeout(timeout);
    }
})