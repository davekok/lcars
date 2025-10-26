import {LayoutSlotManager} from "/assets/view.mjs";

const css = `
    :host {
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        z-index: 1;
        display: grid;
        background-color: var(--theme-color-background);
        grid-template-columns:
            var(--stylish-vbar-width)
            minmax(50rem, calc(100vw - var(--stylish-vbar-width)));
        grid-template-rows:
            var(--header-height)
            var(--stylish-vbar-gap-height)
            var(--stylish-vbar2-height)
            auto;
        padding-left: var(--stylish-hbar-gap-width);
    }

    :host>.header-left {
        grid-column-start: 1;
        grid-column-end: 2;
        grid-row-start: 1;
        grid-row-end: 2;
        background-color: var(--theme-color-2);
        border-bottom-left-radius: var(--outer-radius);
        box-shadow:
            inset 0 calc(var(--stylish-vbar1-height)) var(--theme-color-4),
            inset 0 calc(var(--stylish-vbar1-height) + var(--stylish-vbar-gap-height)) var(--theme-color-background);
    }

    :host>.header-bottom {
        grid-column-start: 2;
        grid-column-end: 3;
        grid-row-start: 1;
        grid-row-end: 2;
        background-color: var(--theme-color-2);
        box-shadow:
            inset calc(-1 * var(--stylish-hbar1-width)) 0 var(--theme-color-3),
            inset calc(-1 * (
                1 * var(--stylish-hbar-gap-width)
                + var(--stylish-hbar1-width)
            )) 0 var(--theme-color-background),
            inset calc(-1 * (
                1 * var(--stylish-hbar-gap-width)
                + var(--stylish-hbar1-width)
                + var(--stylish-hbar2-width)
            )) 0 var(--theme-color-4),
            inset calc(-1 * (
                2 * var(--stylish-hbar-gap-width)
                + var(--stylish-hbar1-width)
                + var(--stylish-hbar2-width)
            )) 0 var(--theme-color-background),
            inset calc(-1 * (
                2 * var(--stylish-hbar-gap-width)
                + var(--stylish-hbar1-width)
                + var(--stylish-hbar2-width)
                + var(--stylish-hbar3-width)
            )) 0 var(--theme-color-4),
            inset calc(-1 * (
                3 * var(--stylish-hbar-gap-width)
                + var(--stylish-hbar1-width)
                + var(--stylish-hbar2-width)
                + var(--stylish-hbar3-width)
            )) 0 var(--theme-color-background),
            inset calc(-1 * (
                3 * var(--stylish-hbar-gap-width)
                + var(--stylish-hbar1-width)
                + var(--stylish-hbar2-width)
                + var(--stylish-hbar3-width)
                + var(--stylish-hbar4-width)
            )) 0 var(--theme-color-1),
            inset calc(-1 * (
                4 * var(--stylish-hbar-gap-width)
                + var(--stylish-hbar1-width)
                + var(--stylish-hbar2-width)
                + var(--stylish-hbar3-width)
                + var(--stylish-hbar4-width)
            )) 0 var(--theme-color-background);
    }

    :host>:nth-child(4) {
        grid-column-start: 2;
        grid-column-end: 3;
        grid-row-start: 1;
        grid-row-end: 2;
        background-color: var(--theme-color-background);
        margin-bottom: var(--stylish-hbar-height);
        border-bottom-left-radius: var(--inner-radius);
    }

    :host>.aside-top {
        grid-column-start: 1;
        grid-column-end: 2;
        grid-row-start: 3;
        grid-row-end: 4;
        background-color: var(--theme-color-3);
        border-top-left-radius: var(--outer-radius);
    }

    :host>aside {
        grid-column-start: 1;
        grid-column-end: 2;
        grid-row-start: 4;
        grid-row-end: 5;
        background-color: var(--theme-color-background);
        display: flex;
        flex-direction: column;
        gap: var(--stylish-vbar-gap-height);
    }
    :host>aside>.aside-fill-top {
        margin-top: var(--stylish-vbar-gap-height);
        width: var(--stylish-vbar-width);
        height: var(--stylish-vbar2-height);
        background-color: var(--theme-color-3);
    }
    :host>aside>.aside-fill-bottom {
        width: var(--stylish-vbar-width);
        flex: 1;
        background-color: var(--theme-color-5);
    }
    :host>.main-top {
        position: relative;
        grid-column-start: 2;
        grid-column-end: 3;
        grid-row-start: 3;
        grid-row-end: 4;
        background-color: var(--theme-color-3);
        box-shadow:
            inset calc(-1 * var(--stylish-hbar1-width)) 0 var(--theme-color-5),
            inset calc(-1 * (
                1 * var(--stylish-hbar-gap-width)
                + var(--stylish-hbar1-width)
            )) 0 var(--theme-color-background),
            inset calc(-1 * (
                1 * var(--stylish-hbar-gap-width)
                + var(--stylish-hbar1-width)
                + var(--stylish-hbar2-width)
            )) 0 var(--theme-color-4),
            inset calc(-1 * (
                2 * var(--stylish-hbar-gap-width)
                + var(--stylish-hbar1-width)
                + var(--stylish-hbar2-width)
            )) 0 var(--theme-color-background),
            inset calc(-1 * (
                2 * var(--stylish-hbar-gap-width)
                + var(--stylish-hbar1-width)
                + var(--stylish-hbar2-width)
                + var(--stylish-hbar3-width)
            )) 0 var(--theme-color-6),
            inset calc(-1 * (
                3 * var(--stylish-hbar-gap-width)
                + var(--stylish-hbar1-width)
                + var(--stylish-hbar2-width)
                + var(--stylish-hbar3-width)
            )) 0 var(--theme-color-background),
            inset calc(-1 * (
                3 * var(--stylish-hbar-gap-width)
                + var(--stylish-hbar1-width)
                + var(--stylish-hbar2-width)
                + var(--stylish-hbar3-width)
                + var(--stylish-hbar4-width)
            )) 0 var(--theme-color-6),
            inset calc(-1 * (
                4 * var(--stylish-hbar-gap-width)
                + var(--stylish-hbar1-width)
                + var(--stylish-hbar2-width)
                + var(--stylish-hbar3-width)
                + var(--stylish-hbar4-width)
            )) 0 var(--theme-color-background);
    }

    :host>.main-top::before {
        content: " ";
        display: block;
        position: absolute;
        top: var(--stylish-hbar-small-height);
        right: calc(
            2 * var(--stylish-hbar-gap-width)
            + var(--stylish-hbar1-width)
            + var(--stylish-hbar2-width)
            - (var(--stylish-hbar-gap-width)/2)
        );
        width: calc(var(--stylish-hbar3-width) + var(--stylish-hbar-gap-width));
        height: calc(var(--stylish-hbar-height) - var(--stylish-hbar-small-height));
        background-color: var(--theme-color-background);
        z-index: 1;
    }

    :host>:last-child {
        grid-column-start: 2;
        grid-column-end: 3;
        grid-row-start: 3;
        grid-row-end: 5;
        background-color: var(--theme-color-background);
        margin-top: var(--stylish-hbar-height);
        border-top-left-radius: var(--inner-radius);
        position: relative;
    }
`;

customElements.define("lcars-header-main-layout", class LcarsHeaderMainLayout extends HTMLElement
{
    #shadow;
    #slots
    #style;
    #headerLeft;
    #headerBottom;
    #asideTop;
    #aside;
    #asideFillTop;
    #asideFillBottom;
    #mainTop;

    constructor()
    {
        super();
        this.#shadow = this.attachShadow({ mode: 'closed' });
        this.#slots = new LayoutSlotManager("header", "main", "nav");
        this.#style = document.createElement('style');
        this.#headerLeft = document.createElement("div");
        this.#headerBottom = document.createElement("div");
        this.#asideTop = document.createElement("div");
        this.#aside = document.createElement("aside");
        this.#asideFillTop = document.createElement("div");
        this.#asideFillBottom = document.createElement("div");
        this.#mainTop = document.createElement("div");
        this.#style.textContent = css;
        this.#headerLeft.className = "header-left";
        this.#headerBottom.className = "header-bottom";
        this.#asideTop.className = "aside-top";
        this.#asideFillTop.className = "aside-fill-top";
        this.#asideFillBottom.className = "aside-fill-bottom";
        this.#mainTop.className = "main-top";

        this.#aside.appendChild(this.#asideFillTop);
        this.#aside.appendChild(this.#slots.get("nav"));
        this.#aside.appendChild(this.#asideFillBottom);

        this.#shadow.appendChild(this.#style);
        this.#shadow.appendChild(this.#headerLeft);
        this.#shadow.appendChild(this.#headerBottom);
        this.#shadow.appendChild(this.#slots.get("header"));
        this.#shadow.appendChild(this.#asideTop);
        this.#shadow.appendChild(this.#aside);
        this.#shadow.appendChild(this.#mainTop);
        this.#shadow.appendChild(this.#slots.get("main"));
    }

    /**
     * @param {VmComponentModel[]} componentModels
     */
    renderLayout(componentModels) {
        this.#slots.renderSlots(componentModels);
    }
});
