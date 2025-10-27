import {ViewElement} from "/assets/view.mjs";

const css = `
    :host {
        position: fixed;
        left: 0;
        top: 0;
        width: 100vw;
        height: 100vh;
        margin: 0;
        box-sizing: border-box;

        #layer-main {
            z-index: 0;
        }

        #layer-dialog {
            z-index: 1;
        }

        simple-layout {
            display: flex;
            flex-flow: column no-wrap;
            justify-content: center;
            align-items: center;
            background: rgba(0,0,0,0.66);
        }
    }
`;

class LcarsView extends ViewElement {
    #shadow;

    constructor() {
        super();
        this.#shadow = this.attachShadow({mode: 'closed'});
        this.#shadow.innerHTML = `<style>${css}</style>`;
        this.defineLayers(["main", "dialog"]);
    }

    /**
     * @param {string} layer
     * @returns {string}
     */
    #makeLayoutId(layer) {
        return `layer-${layer}`;
    }

    /**
     * @param {string} layer
     * @returns {Element}
     */
    getLayoutElement(layer) {
        return this.#shadow.children.namedItem(this.#makeLayoutId(layer));
    }

    /**
     * @param {string} layer
     * @param {Element} layoutElement
     */
    setLayoutElement(layer, layoutElement) {
        const layerId = this.#makeLayoutId(layer);
        const existing = this.#shadow.children.namedItem(layerId);
        if (existing) {
            existing.replaceWith(layoutElement);
        } else {
            layoutElement.id = layerId;
            this.#shadow.appendChild(layoutElement);
        }
    }
}

customElements.define('lcars-view', LcarsView);
