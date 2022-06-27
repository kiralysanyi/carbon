class select {
    constructor() {
        this.mainObj = document.createElement("div");
        this.selectorObj = document.createElement("div");
        this.mainObj.classList.add("select");
        this.selectorObj.classList.add("selector");
        this.textDisplay = document.createElement("a");
        this.textDisplay.classList.add("text");
        this.items = [];
        this.mainObj.appendChild(this.textDisplay);
        this.mainObj.appendChild(this.selectorObj);
        this.value = "";
        this.shown = false;
        this.itemCount = 0;
        this.onchange = () => {};

        window.addEventListener("click", () => {
            if (this.shown == true) {
                this.hide(); 
            }
        });

        window.addEventListener("resize", () => {
            if (this.shown == true) {
                this.hide(); 
            }
        });

        this.selectorObj.style.display = "none";

        this.mainObj.onclick = () => {
            if (this.shown == false) {
                this.show();
            }
            else {
                this.hide();
            }
        }

        this.options = {};
    }

    addOption(DisplayName, value) {
        if (this.itemCount == 0) {
            this.textDisplay.innerHTML = DisplayName;
            this.value = value;
        }
        this.itemCount++;
        this.options[value] = DisplayName;
        var item = document.createElement("div");
        item.classList.add("item");
        this.selectorObj.appendChild(item);
        item.innerHTML = DisplayName;

        item.onclick = () => {
            this.value = value;
            this.onchange();
            this.textDisplay.innerHTML = DisplayName;
        }
        this.items.push(item);
    }

    show() {
        var position = this.mainObj.getBoundingClientRect();
        this.selectorObj.style.top = (position.top + 40) + "px";
        this.selectorObj.style.left = position.left + "px";

        this.selectorObj.style.display = "block";
        setTimeout(() => {
            this.selectorObj.style.height = (40 * this.itemCount) + "px";
            this.shown = true;
        }, 10);
        setTimeout(() => {
            for (var x in this.items) {
                var obj = this.items[x];
                obj.style.opacity = 1;
            }
        }, 200);
    }

    hide() {
        this.selectorObj.style.height = "0px";
        this.shown = false;
        for (var x in this.items) {
            var obj = this.items[x];
            obj.style.opacity = 0;
        }
        setTimeout(() => {
            this.selectorObj.style.display = "none";
        }, 200);
    }

    setValue(value) {
        if (this.options[value]) {
            this.textDisplay.innerHTML = this.options[value];
            this.value = value;
        }
        else {
            console.error("Option not found: " + value, " Can't set value.");
        }
    }

}