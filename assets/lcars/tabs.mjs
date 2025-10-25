const css = `
    :host
    {
        display: flex;
        flex-direction: column;
        width: var(--stylish-vbar-width);
        margin: 0;
        padding: 0;
        gap: var(--stylish-vbar-gap-height);
    }
    :host>.tab-button {
        border: none;
        background-color: var(--theme-color-1);
        margin: 0;
        padding: 0;
        width: var(--stylish-vbar-width);
        height: var(--stylish-vbar4-height);
        color: var(--theme-color-background);
        font-size: 1.3rem;
        font-weight: bold;
        position:relative;
    }
    :host>.tab-button:active {
        box-shadow:
            inset var(--stylish-button-handle) 0 var(--theme-color-5),
            inset calc((var(--stylish-button-handle) + var(--stylish-vbar-gap-height))) 0 var(--theme-color-background);
    }
    :host>.tab-button.selected {
        box-shadow:
            inset var(--stylish-button-handle) 0 var(--theme-color-4),
            inset calc((var(--stylish-button-handle) + var(--stylish-vbar-gap-height))) 0 var(--theme-color-background);
    }
    :host>.tab-button:active.selected {
        box-shadow:
            inset var(--stylish-button-handle) 0 var(--theme-color-2),
            inset calc((var(--stylish-button-handle) + var(--stylish-vbar-gap-height))) 0 var(--theme-color-background);
    }
`;

customElements.define("lcars-tabs", class LcarsTabs extends HTMLElement
{
    /** @type {HTMLStyleElement} */
    #style;

    /** @type {ShadowRoot} */
    #shadow;

    /** @type {HTMLElement} */
    #selectedTabButton;

    constructor()
    {
        super();
        this.#shadow = this.attachShadow({mode: 'closed'});
        this.#style = document.createElement('style');
        this.#style.textContent = css;
        this.#shadow.appendChild(this.#style);
    }

    #select(element)
    {
        if (this.#selectedTabButton) {
            if (this.#selectedTabButton === element) {
                return;
            }
            this.#selectedTabButton.classList.remove("selected");
        }
        this.#selectedTabButton = element;
        this.#selectedTabButton.classList.add("selected");
        element.link.follow();
    }

    render(model)
    {
        let button = this.#style;
        for (const link of model.links) {
            button = button.nextElementSibling;
            if (!button) {
                button = document.createElement("button");
                button.classList.add("tab-button");
                button.addEventListener('click', (event) => this.#select(event.target));
                this.#shadow.appendChild(button);
            }
            button.link = link;
            button.title = link.title;
            button.textContent = link.title;
            if (link.selected) {
                this.#select(button);
            }
        }
        while (this.#shadow.lastElementChild !== button) {
            this.#shadow.removeChild(this.#shadow.lastElementChild);
        }
    }
});
