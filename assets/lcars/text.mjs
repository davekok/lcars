const css = `
    :host>div {
        margin: 5rem;
        color: var(--theme-color-7);
    }
`;

customElements.define("lcars-text", class LcarsText extends HTMLElement
{
    /** @type {ShadowRoot} */
    #shadow;

    /** @type {HTMLElement} */
    #text;

    constructor()
    {
        super();
        this.#shadow = this.attachShadow({mode: 'closed'});
        const style = document.createElement('style');
        style.textContent = css;
        this.#shadow.appendChild(style);
        this.#text = document.createElement('div');
        this.#shadow.appendChild(this.#text);
    }

    /**
     * @param {VmComponentModel} vmComponentModel
     * @returns {void}
     */
    render(vmComponentModel)
    {
        this.#text.textContent = vmComponentModel.data.text;
    }
});
