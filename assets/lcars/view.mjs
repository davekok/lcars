const css = `
    .layer {
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

            .dynamic-layer {
                display: flex;
                flex-flow: column no-wrap;
                justify-content: center;
                align-items: center;
                background: rgba(0,0,0,0.66);
            }
        }
    }
`;

customElements.define('lcars-view', class LcarsView extends HTMLElement {
    #shadow;

    constructor() {
        super();
        this.#shadow = this.attachShadow({mode: 'closed'});
        this.#shadow.innerHTML = `<style>${css}</style>`;
    }

    connectedCallback() {
        globalThis.viewModel.connect(this.#shadow, ["main", "dialog"]);
    }

    disconnectedCallback() {
        globalThis.viewModel.disconnect();
    }
});
