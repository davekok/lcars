import {assets} from "/assets/assets.mjs";
import "/assets/dom.mjs";

/**
 * Base class for views.
 * @abstract
 */
export class ViewElement extends HTMLElement {
    /**
     * The specified layers by the view.
     *
     * @type {string[]}
     */
    #layers;

    constructor() {
        super();
    }

    /**
     * @param {string[]} layers
     */
    defineLayers(layers) {
        this.#layers = layers;
    }

    /**
     * @abstract
     * @param {string} layer
     * @returns {Element}
     */
    getLayoutElement(layer) {
        throw new Error(`Abstract method ViewElement::getLayoutElement not implemented in ${this.constructor.name}.`);
    }

    /**
     * @abstract
     * @param {string} layer
     * @param {Element} layoutElement
     * @returns {void}
     */
    setLayoutElement(layer, layoutElement) {
        throw new Error(`Abstract method ViewElement::setLayoutElement not implemented in ${this.constructor.name}.`);
    }

    connectedCallback() {
        globalThis.viewModel.connect(this);
    }

    disconnectedCallback() {
        for (const layer in this.#layers) {
            this.getLayoutElement(layer)?.remove();
        }
        globalThis.viewModel.disconnect();
    }

    /**
     * Render the view model.
     *
     * @param {ViewModel} viewModel
     * @return {Promise<void>}
     */
    async renderView(viewModel) {
        for (const layer of this.#layers) {
            if (!viewModel.layers.has(layer)) {
                this.getLayoutElement(layer)?.remove();
                continue;
            }

            const componentModels = viewModel.layers.get(layer);
            const oldLayoutElement = this.getLayoutElement(layer);
            const layout = componentModels[0].head.layout;
            const layoutTag = layout ? await assets.tag(layout) : "simple-layout";

            if (oldLayoutElement?.equals(layoutTag)) {
                oldLayoutElement.renderLayout(componentModels);
                continue;
            }

            const newLayoutElement = globalThis.document.createElement(layoutTag);
            this.setLayoutElement(layer, newLayoutElement);
            newLayoutElement.renderLayout(componentModels);
        }
    }
}

export class LayoutSlotManager {
    #slots;

    /**
     * @param {...string} slots
     */
    constructor(...slots) {
        this.#slots = new Map;
        for (const slot of slots) {
            this.#slots.set(slot, globalThis.document.createElement('div'));
        }
    }

    get(slot) {
        return this.#slots.get(slot);
    }

    /**
     * Override this function in your own layout. And don't call it when you do.
     *
     * @param {VmComponentModel[]} componentModels
     */
    renderSlots(componentModels)
    {
        for (const componentModel of componentModels) {
            assets.tag(componentModel.head.component).then((componentTag) => {
                const slot = componentModel.head.slot;
                const oldElement = this.#slots.get(slot);
                if (oldElement?.equals(componentTag)) {
                    oldElement.render(componentModel);
                    return;
                }

                const newElement = globalThis.document.createElement(componentTag);
                this.#slots.set(slot, newElement);
                oldElement.replaceWith(newElement);
                newElement.render(componentModel);
            });
        }
    }
}

class SimpleLayout extends HTMLElement {
    #shadow;
    #slots;

    constructor() {
        super();
        this.#shadow = this.attachShadow({mode: "closed"});
        this.#slots = new LayoutSlotManager("main");
        this.#shadow.appendChild(this.#slots.get("main"));
    }

    /**
     * @param {VmComponentModel[]} componentModels
     */
    renderLayout(componentModels) {
        this.#slots.renderSlots(componentModels);
    }
}

customElements.define("simple-layout", SimpleLayout);
