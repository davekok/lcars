/**
 * A simple view model implementation.
 */
class ViewModel {
    /**
     * Determines where web component modules are downloaded from. Could also be used for versioning.
     *
     * Template URL: /assets/{design}/{component}.mjs
     * Template HTML Tag: {design}-{component}
     *
     * @type {string}
     */
    #design;

    /**
     * Whether the main view just connected to the view model instance.
     *
     * @type {boolean}
     */
    #justConnected = false;

    /**
     * Array of component models, each web component gets its own model.
     *
     * @type {Array<VmComponentModel>}
     */
    #vmComponentModels;

    /**
     * Component models ordered by layer.
     *
     * @type {Map<string,Array<VmComponentModel>>}
     */
    #vmLayers;

    /**
     * The main or first component model in the response.
     *
     * @type {VmComponentModel}
     */
    #vmMain;

    /**
     * The specified layers by the view.
     *
     * @type {Array<string>}
     */
    #layers;

    /**
     * The container (shadow DOM) of the view.
     *
     * @type {Node}
     */
    #container;

    /**
     * @typedef {(event: PopStateEvent) => void} PopStateEventLister
     * @type {PopStateEventLister|null}
     */
    #popStateEventListener;

    /**
     * The current reference.
     *
     * @type {string}
     */
    #current;

    constructor() {
        this.#popStateEventListener = (event) => this.update(event.state);
        globalThis.addEventListener("popstate", this.#popStateEventListener);
    }

    /**
     * Set the window title.
     *
     * @param {string} value
     */
    set title(value) {
        if (typeof value === "string") {
            globalThis.document.title = value;
        }
    }

    /**
     * Set the document language.
     *
     * @param {string} value
     */
    set language(value) {
        if (typeof value === "string") {
            globalThis.document.documentElement.lang = value;
        }
    }

    /**
     * Set the document description.
     *
     * @param {string} value
     */
    set description(value) {
        if (typeof value === "string") {
            const description = globalThis.document.querySelector('head>meta[name=description]');
            if (description) {
                description.content = value;
            } else {
                const description = globalThis.document.createElement("meta");
                description.name = "description";
                description.content = value;
                globalThis.document.head.appendChild(description);
            }
        }
    }

    /**
     * Get the theme
     *
     * @return {string}
     */
    get theme() {
        return globalThis.document.documentElement.className.substring(6);
    }

    /**
     * Set the theme
     *
     * @param {string} value
     */
    set theme(value) {
        globalThis.document.documentElement.className = `theme-${value}`;
    }

    /**
     * @return {string}
     */
    get design() {
        return this.#design;
    }

    /**
     * Function for the view to connect to the view model.
     *
     * @param {Node} container
     * @param {Array<string>} layers
     */
    connect(container, layers) {
        this.#justConnected = true;
        this.#container = container;
        this.#layers = layers;
        this.render();
    }

    /**
     * Function for the view to disconnect from the view model.
     */
    disconnect() {
        for (const layer in this.#layers) {
            this.#getLayout(layer)?.remove();
        }
        this.#container = null;
        this.#layers = [];
    }

    /**
     * Navigate to a reference.
     *
     * @param {string} ref
     * @param {any[]|object} params
     * @param {any[]|object} data
     * @return {Promise<void>}
     */
    async navigate(ref, params, data) {
        const response = await fetch("/", {
            body: JSON.stringify({
                "ref": ref,
                "current": this.#current,
                "params": params ?? [],
                "data": data ?? [],
            }),
            method: "POST",
            mode: "no-cors",
            cache: "no-cache",
            credentials: "omit",
            redirect: "error",
            referrerPolicy: "no-referrer"
        });
        const vm = await response.json();
        this.#current = ref;
        await this.update(vm);
        if (this.#justConnected) {
            this.#justConnected = false;
            return;
        }
        if (this.#container instanceof Node) {
            await this.render();
        }
    }

    /**
     * Update the view model with the joined component models from the server.
     *
     * @param {object[]} vm
     * @return {Promise<void>}
     */
    async update(vm) {
        this.#vmComponentModels = [];
        this.#vmLayers = new Map();
        for (const cm of vm) {
            const vmComponentModel = new VmComponentModel(this, cm);
            const layer = vmComponentModel.head.layer;
            if (!this.#vmLayers.has(layer)) {
                this.#vmLayers.set(layer, []);
            }
            this.#vmLayers.get(layer).push(vmComponentModel);
            this.#vmComponentModels.push(vmComponentModel);
        }
        this.#vmMain = this.#vmComponentModels[0];

        switch (this.#vmMain.head.history) {
            case "push":
                globalThis.history.pushState(vm, "");
                break;

            case "replace":
                globalThis.history.replaceState(vm, "");
                break;

            case "back":
                globalThis.removeEventListener("popstate", this.#popStateEventListener);
                globalThis.history.back();
                globalThis.history.replaceState(vm, "");
                globalThis.addEventListener("popstate", this.#popStateEventListener);
                break;

            case "ignore":
                break;
        }

        this.title = this.#vmMain.head.title;
        this.description = this.#vmMain.head.description;
        this.language = this.#vmMain.head.language;
        this.theme = this.#vmMain.head.theme;

        const icon = this.#vmMain.head.icon;
        const design = this.#vmMain.head.design;

        if (typeof icon === "string") {
            const iconElement = globalThis.document.querySelector('head>link[rel=icon]');
            const iconHref = `/assets/${design??this.#design}/${icon}.ico`;
            if (iconElement) {
                iconElement.href = iconHref;
            } else {
                const iconElement = globalThis.document.createElement("link");
                iconElement.rel = "icon";
                iconElement.href = iconHref;
                globalThis.document.head.appendChild(iconElement);
            }
        }

        if (typeof design === "string") {
            this.#design = design;
            const baseUrl = `/assets/${this.#design}`;
            const stylesheet = globalThis.document.querySelector('head>link[rel=stylesheet]');
            const styleHref = `${baseUrl}/theme.css`;
            if (stylesheet) {
                stylesheet.href = styleHref;
            } else {
                const stylesheet = globalThis.document.createElement("link");
                stylesheet.rel = "stylesheet";
                stylesheet.href = styleHref;
                globalThis.document.head.appendChild(stylesheet);
            }

            await import(`${baseUrl}/view.mjs`);
            const tag = `${this.#vmMain.head.design}-view`;
            const oldViewElement = globalThis.document.body.firstElementChild;
            if (oldViewElement?.nodeName.toLowerCase() === tag.toLowerCase()) {
                return;
            }
            const view = globalThis.document.createElement(tag);
            if (globalThis.document.body.firstElementChild) {
                globalThis.document.body.firstElementChild.replaceWith(view);
            } else {
                globalThis.document.body.appendChild(view);
            }
        }
    }

    /**
     * Render the view model.
     *
     * @return {Promise<void>}
     */
    async render() {
        for (const layer of this.#layers) {
            if (!this.#vmLayers.has(layer)) {
                this.#getLayout(layer)?.remove();
                continue;
            }

            const vmLayer = this.#vmLayers.get(layer);
            const vmMain = vmLayer[0];
            const oldLayoutElement = this.#getLayout(layer);
            if (oldLayoutElement instanceof Node && vmMain.layoutEquals(oldLayoutElement)) {
                vmMain.renderLayout(oldLayoutElement, vmLayer);
                continue;
            }

            const newLayoutElement = await this.createElement(vmMain.head.layoutTag);
            newLayoutElement.id = ViewModel.#makeLayoutId(layer);
            if (oldLayoutElement) {
                oldLayoutElement.replaceWith(newLayoutElement);
            } else {
                this.#container.appendChild(newLayoutElement);
            }
            vmMain.renderLayout(newLayoutElement, vmLayer);
        }
    }

    /**
     * @param {string} layer
     * @returns {string}
     */
    static #makeLayoutId(layer) {
        return `layer-${layer}`;
    }

    /**
     * @param {string} layer
     * @returns {Element|null}
     */
    #getLayout(layer) {
        return this.#container.children.namedItem(ViewModel.#makeLayoutId(layer));
    }

    static #moduleImported = new Set();

    /**
     * @param {string} tag
     * @returns {Promise<Element>}
     */
    async createElement(tag) {
        if (tag.startsWith(this.#design)) {
            const module = `/assets/${this.#design}/${tag.substring(this.#design.length + 1)}.mjs`;
            if (!ViewModel.#moduleImported.has(module)) {
                await import(module);
                ViewModel.#moduleImported.add(module);
            }
        }
        return globalThis.document.createElement(tag);
    }
}

class VmComponentModel {
    #vm;
    #head;
    #parameterSchema;
    #parameters;
    #schema;
    #data;
    #links;

    /**
     *
     * @param {ViewModel} vm
     * @param {Object} vmComponentModel
     */
    constructor(vm, vmComponentModel) {
        this.#vm = vm;
        this.#head = new VmHead(vm, vmComponentModel.head);
        this.#parameters = vmComponentModel.parameters ?? {};
        this.#data = vmComponentModel.data;
        this.#schema = [];
        for (const schema of vmComponentModel.schema ?? []) {
            this.#schema.push(new VmSchema(vm, schema));
        }
        this.#parameterSchema = [];
        for (const schema of vmComponentModel.parameterSchema ?? []) {
            this.#parameterSchema.push(new VmSchema(vm, schema));
        }
        this.#links = [];
        for (const link of vmComponentModel.links ?? []) {
            this.#links.push(new VmLink(vm, link));
        }
    }

    /**
     * @returns {VmHead}
     */
    get head() {
        return this.#head;
    }

    /**
     * @returns {Array<VmSchema>}
     */
    get parameterSchema() {
        return this.#parameterSchema;
    }

    /**
     * @returns {Object}
     */
    get parameters() {
        return this.#parameters;
    }

    /**
     * @returns {Array<VmSchema>}
     */
    get schema() {
        return this.#schema;
    }

    /**
     * @returns {Object|Array}
     */
    get data() {
        return this.#data;
    }

    /**
     * @returns {Array<VmLink>}
     */
    get links() {
        return this.#links;
    }

    /**
     * @typedef {(newElement: Element) => void} Appender
     * @param {Element|null} oldElement
     * @param {Appender|undefined} appender
     * @returns {Promise<Element>}
     */
    async render(oldElement, appender) {
        if (oldElement instanceof Element && oldElement.nodeName.toLowerCase() === this.#head.tag.toLowerCase()) {
            oldElement.render(this);
            return oldElement;
        }

        const newElement = await this.#vm.createElement(this.#head.tag);
        if (oldElement instanceof Element) {
            oldElement.replaceWith(newElement);
        } else {
            appender(newElement);
        }
        newElement.render(this);

        return newElement;
    }

    /**
     * @param {Element} layoutElement
     * @returns {boolean}
     */
    layoutEquals(layoutElement) {
        return layoutElement.nodeName.toLowerCase() === this.#head.layoutTag.toLowerCase();
    }

    /**
     * @param {Element} layoutElement
     * @param {Array<VmComponentModel>} vmLayer
     */
    renderLayout(layoutElement, vmLayer) {
        layoutElement.classList.add("layer");

        if (this.#head.isDynamicLayout === false) {
            layoutElement.classList.remove("dynamic-layer");
            layoutElement.render(vmLayer);
            return;
        }

        layoutElement.classList.add("dynamic-layer");

        this.render(
            layoutElement.firstElementChild,
            newElement => layoutElement.appendChild(newElement)
        );
    }
}

class VmHead {
    #vm;
    #head;

    /**
     * @param {ViewModel} vm
     * @param {Object} head
     */
    constructor(vm, head) {
        if (!(head instanceof Object)) {
            throw new Error("Expected vmHead to be an object.");
        }
        this.#vm = vm;
        this.#head = head;
    }

    /**
     * @returns {"push"|"ignore"|"replace"|"back"}
     */
    get history() {
        if (
            this.#head.history === undefined
            || this.#head.history === null
            || this.#head.history === "push"
            || this.#head.history === "ignore"
            || this.#head.history === "replace"
            || this.#head.history === "back"
        ) {
            return this.#head?.history ?? "push";
        }
        throw new Error("Expected history to be a 'push', 'ignore', 'replace', 'back' or null.");
    }

    /**
     * @returns {string|null}
     */
    get title() {
        if (this.#head.title === undefined || this.#head.title === null || typeof this.#head.title === "string") {
            return this.#head.title ?? null;
        }
        throw new Error("Expected title to be a string or null.");
    }

    /**
     * @returns {string|null}
     */
    get language() {
        if (this.#head.language === undefined || this.#head.language === null || typeof this.#head.language === "string") {
            return this.#head.language ?? null;
        }
        throw new Error("Expected language to be a string or null.");
    }

    /**
     * @returns {string|null}
     */
    get description() {
        if (this.#head.description === undefined || this.#head.description === null || typeof this.#head.description === "string") {
            return this.#head.description ?? null;
        }
        throw new Error("Expected description to be a string or null.");
    }

    /**
     * @returns {string|null}
     */
    get icon() {
        if (this.#head.icon === undefined || this.#head.icon === null || typeof this.#head.icon === "string") {
            return this.#head.icon ?? null;
        }
        throw new Error("Expected icon to be a string or null.");
    }

    /**
     * @returns {string|null}
     */
    get design() {
        if (this.#head.design === undefined || this.#head.design === null || typeof this.#head.design === "string") {
            return this.#head.design ?? null;
        }
        throw new Error("Expected design to be a string or null.");
    }

    /**
     * @returns {string}
     */
    get theme() {
        if (this.#head.theme === undefined || this.#head.theme === null || typeof this.#head.theme === "string") {
            return this.#head.theme ?? "default";
        }
        throw new Error("Expected theme to be a string or null.");
    }

    /**
     * @returns {string}
     */
    get layer() {
        if (this.#head.layer === undefined || this.#head.layer === null || typeof this.#head.layer === "string") {
            return this.#head.layer ?? "main";
        }
        throw new Error("Expected layer to be a string or null.");
    }

    /**
     * @returns {string}
     */
    get layout() {
        if (this.#head.layout === undefined || this.#head.layout === null || typeof this.#head.layout === "string") {
           return this.#head.layout ?? null;
        }
        throw new Error("Expected layout to be a string or null.");
    }

    /**
     * @returns {string}
     */
    get layoutTag() {
        return this.makeTag(this.layout);
    }

    /**
     * @returns {boolean}
     */
    get isDynamicLayout() {
        return null === this.#head.layout ?? null;
    }

    /**
     * @returns {string}
     */
    get slot() {
        if (this.#head.slot === undefined || this.#head.slot === null || typeof this.#head.slot === "string") {
            return this.#head.slot ?? "main";
        }
        throw new Error("Expected slot to be a string or null.");
    }

    /**
     * @returns {string}
     */
    get component() {
        if (typeof this.#head.component === "string") {
            return this.#head.component;
        }
        throw new Error("Expected component to be a string.");
    }

    /**
     * @returns {string}
     */
    get tag() {
        return this.makeTag(this.#head.component);
    }

    /**
     * @returns {string}
     */
    makeTag(component) {
        return component === null
            ? "div"
            : `${this.#vm.design}-${component}`;
    }
}

class VmSchema {
    #vm;
    #schema;

    /**
     * @param {ViewModel} vm
     * @param {Object} schema
     */
    constructor(vm, schema) {
        this.#vm = vm;
        this.#schema = schema;
    }

    /**
     * @return {string}
     */
    get name() {
        return this.#schema.name;
    }

    /**
     * @return {string}
     */
    get label() {
        return this.#schema.label;
    }

    /**
     * @return {string}
     */
    get type() {
        return this.#schema.type;
    }

    /**
     * @return {any[]}
     */
    get options() {
        return this.#schema.options;
    }

    /**
     * @return {string}
     */
    get bind() {
        return this.#schema.bind;
    }
}

class VmLink {
    #vm;
    #link;

    /**
     * @param {ViewModel} vm
     * @param {Object} link
     */
    constructor(vm, link) {
        this.#vm = vm;
        this.#link = link;
    }

    /**
     * @returns {string}
     */
    get id() {
        if (["string", "number"].indexOf(typeof this.#link.id) >= 0) {
            return this.#link.id;
        }
        throw new Error("Expected id to be a string or number.");
    }

    /**
     * @returns {string|null}
     */
    get title() {
        if (this.#link.title === undefined || this.#link.title === null || typeof this.#link.title === "string") {
            return this.#link.title ?? null;
        }
        throw new Error("Expected title to be a string or null.");
    }

    /**
     * @returns {string|null}
     */
    get ref() {
        if (this.#link.ref === undefined || this.#link.ref === null || typeof this.#link.ref === "string") {
            return this.#link.ref ?? null;
        }
        throw new Error("Expected ref to be a string or null.");
    }

    /**
     * @returns {void}
     */
    follow() {
        this.#vm.navigate(this.ref);
    }
}

globalThis.viewModel = new ViewModel();
await globalThis.viewModel.navigate("@default");
