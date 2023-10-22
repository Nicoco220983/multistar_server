import Consts from './consts.mjs'

class ColorPicker extends HTMLElement {

    connectedCallback() {
        this.initContent()
    }

    initContent() {
        const shdw = this.attachShadow({ mode: "open" })
        shdw.innerHTML = `
            <style>
                :host {
                    display: inline-flex;
                    flex-direction: row;
                    gap: .5em;
                    flex-wrap: wrap;
                }
                .color {
                    width: 3em;
                    height: 3em;
                    cursor: pointer;
                }
                .color.selected {
                    outline: 5px solid grey;
                }
            </style>
            <template id="colortmpl">
                <div class="color"></div>
            </template>
        `
        this.colorTmpl = shdw.getElementById("colortmpl")
        this.initColors()
    }

    initColors() {
        const shdw = this.shadowRoot
        for(const color of Consts.PLAYER_COLORS) {
            const colorEl = this.colorTmpl.content.cloneNode(true).querySelector(".color")
            colorEl.classList.add(`color_${color}`)
            colorEl.style.backgroundColor = color
            shdw.appendChild(colorEl)
            colorEl.onclick = () => {
                this.syncColor(color)
                this.onSelect(color)
            }
        }
    }

    syncColor(color) {
        const shdw = this.shadowRoot
        for(const el of shdw.querySelectorAll(".color")) {
            el.classList.remove("selected")
        }
        const colorEl = shdw.querySelector(`.color_${color}`)
        if(colorEl) colorEl.classList.add("selected")
    }

    onSelect(color) {}
}
customElements.define("color-picker", ColorPicker)
