var tabs = [];

class tab {
    constructor(title) {
        tabs.push(this);
        this.tab_button = document.createElement("div");
        this.title = document.createElement("a");
        this.tab_button.appendChild(this.title);
        this.container = document.createElement("div");
        this.container.classList.add("content");
        this.tab_button.classList.add("tab");
        this.title.innerHTML = title;
        this.onfocus = () => { };
        this.isFocusButtonEnabled = true;

        document.getElementById("container").appendChild(this.container);
        document.getElementById("tab_bar").appendChild(this.tab_button);

        this.tab_button.onclick = (e) => {
            if (this.isFocusButtonEnabled == true) {
                this.focus();                
            }
        }
    }

    disableFocusButton() {
        this.isFocusButtonEnabled = false;
    }

    focus() {
        //hide other tabs
        for (var x in tabs) {
            tabs[x].container.style.display = "none";
            tabs[x].tab_button.style.backgroundColor = "transparent";
            tabs[x].tab_button.style.height = "40px";
        }

        //show this tab
        this.container.style.display = "block";
        this.tab_button.style.backgroundColor = "rgba(255,255,255, 0.150)";
        this.tab_button.style.height = "38px";
        this.onfocus();
    }
}