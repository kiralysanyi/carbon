class switchbox {
    constructor() {
        this.onchange = null;
        this.mainElement = document.createElement("div");
        this.mainElement.classList.add("switch");
        this.thumb = document.createElement("div");
        this.thumb.classList.add("thumb");
        this.mainElement.appendChild(this.thumb);
        this.state = false;
        this.mainElement.onclick = () => {
            this.toggleState();
        };
    }

    toggleState() {
        if (this.state == true) {
            this.changeState(false);
        }
        else {
            this.changeState(true);
        }

        if (this.onchange) {
            this.onchange();
        }
    }

    changeState(newState) {
        if (newState != true && newState != false) {
            console.error("Invalid state:", newState);
            return;
        }

        if (newState == true) {
            this.thumb.style.left = "45px";
        }
        else {
            this.thumb.style.left = "5px";
        }

        this.state = newState;
    }
}
