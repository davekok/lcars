import {ViewElement} from "/assets/view.mjs";

/**
 * A simple view model implementation.
 */
class ViewModel {
    /**
     * Array of component models, each web component gets its own model.
     *
     * @type {Array<VmComponentModel>}
     */
    componentModels;

    /**
     * Component models ordered by layer.
     *
     * @type {Map<string,Array<VmComponentModel>>}
     */
    layers;

    /**
     * The main or first component model in the response.
     *
     * @type {VmComponentModel}
     */
    main;

    /**
     * The view.
     *
     * @type {ViewElement}
     */
    view;

    /**
     * The current reference.
     *
     * @type {string|null}
     */
    current = null;

    /**
     * Function for the view to connect to the view model.
     *
     * @param {ViewElement} view
     */
    connect(view) {
        if (!(view instanceof ViewElement)) {
            throw new Error(`View does not extend ViewElement.`);
        }
        this.view = view;
        this.view.renderView(this);
    }

    /**
     * Function for the view to disconnect from the view model.
     */
    disconnect() {
        this.view = null;
    }

    /**
     * Navigate to a reference.
     *
     * @param {string} ref
     * @param {object} parameters
     * @param {object} data
     * @return {Promise<void>}
     */
    async navigate(ref, parameters, data) {
        if (ref === "@current") {
            ref = this.current;
        }
        if (ref === this.current) {
            parameters = { ...(this.main?.parameters ?? {}), ...parameters};
            if (!(this.main?.data instanceof Array) && !(data instanceof Array)) {
                data = { ...(this.main?.data ?? {}), ...data};
            }
        }
        const response = await fetch("/", {
            body: JSON.stringify({
                "ref": ref,
                "current": this.current,
                "parameters": parameters,
                "data": data,
            }),
            method: "POST",
            mode: "no-cors",
            cache: "no-cache",
            credentials: "omit",
            redirect: "error",
            referrerPolicy: "no-referrer"
        });
        const vm = await response.json();
        this.current = ref;
        await this.update(vm);
        await this.view?.renderView(this);
    }

    /**
     * Update the view model with the joined component models from the server.
     *
     * @param {object[]} vm
     * @return {Promise<void>}
     */
    async update(vm) {
        if ("error" in vm) {
            alert(vm.error);
            return;
        }

        this.componentModels = [];
        this.layers = new Map();
        for (const cm of vm) {
            const componentModel = new VmComponentModel(this, cm);
            const layer = componentModel.head.layer;
            if (!this.layers.has(layer)) {
                this.layers.set(layer, []);
            }
            this.layers.get(layer).push(componentModel);
            this.componentModels.push(componentModel);
        }
        this.main = this.componentModels[0];

        globalThis.history.updateState(this.main.head.history, vm);
        globalThis.document.updateTitle(this.main.head.title);
        globalThis.document.updateDescription(this.main.head.description);
        globalThis.document.updateLanguage(this.main.head.language);
        globalThis.document.updateTheme(this.main.head.theme);
        await globalThis.document.updateDesign(this.main.head.design);
        globalThis.document.updateIcon(this.main.head.icon);
    }
}

class VmComponentModel {
    #linkManager;
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
        this.#linkManager = new LinkManager();
        this.#vm = vm;
        this.#head = new VmHead(vm, vmComponentModel.head);
        this.#parameters = vmComponentModel.parameters ?? {};
        this.#data = vmComponentModel.data;
        this.#schema = [];
        for (const schema of vmComponentModel.schema ?? []) {
            this.#schema.push(new VmSchema(vm, schema, this.#linkManager, false));
        }
        this.#parameterSchema = [];
        for (const schema of vmComponentModel.parameterSchema ?? []) {
            this.#parameterSchema.push(new VmSchema(vm, schema, this.#linkManager, true));
        }
        this.#links = [];
        for (const link of vmComponentModel.links ?? []) {
            this.#links.push(new VmLink(vm, link, this.#linkManager));
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
     * @returns {Array<VmLink>}
     */
    getLinksForSlot(slot) {
        const links = [];
        for (const link of this.#links) {
            if (link.slot === slot) {
                links.push(link);
            }
        }
        return links;
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
}

class VmSchema {
    #vm;
    #schema;
    #linkManager;
    #isParameter;

    /**
     * @param {ViewModel} vm
     * @param {Object} schema
     * @param {LinkManager} linkManager
     * @param {boolean} isParameter
     */
    constructor(vm, schema, linkManager, isParameter) {
        this.#vm = vm;
        this.#schema = schema;
        this.#linkManager = linkManager;
        this.#isParameter = isParameter;
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

    /**
     * @return {string}
     */
    get slot() {
        return this.#schema.slot;
    }

    /**
     * @return {int}
     */
    get min() {
        return this.#schema.min;
    }

    /**
     * @return {int}
     */
    get max() {
        return this.#schema.max;
    }

    /**
     * @return {boolean}
     */
    get revalidate() {
        return this.#schema.revalidate === true;
    }

    /**
     * @return {boolean}
     */
    get hidden() {
        return this.#schema.state === "hidden";
    }

    /**
     * @return {boolean}
     */
    get editable() {
        return this.#schema.state === undefined || this.#schema.state === "editable";
    }

    /**
     * @return {boolean}
     */
    get readonly() {
        return this.#schema.state === "readonly";
    }

    /**
     * @return {boolean}
     */
    get disabled() {
        return this.#schema.state === "disabled";
    }

    /**
     * @return {"editable"|"hidden"|"readonly"|"disabled"}
     */
    get state() {
        return this.#schema.state ?? "editable";
    }

    createLabel() {
        if (this.state === "hidden") {
            return null;
        }

        const label = document.createElement("label");
        label.innerText = this.label;
        return label;
    }

    createDisplay(value, discriminator) {
        this.#linkManager.addField(this, value, discriminator, this.#isParameter);

        if (this.state === "hidden") {
            return null;
        }

        const display = document.createElement("span");

        if (this.options instanceof Array) {
            for (const option of this.options) {
                const opt = document.createElement("option");
                if (typeof option === "number" || typeof option === "string") {
                    if (value == option) {
                        display.innerText = option;
                        return display;
                    }
                } else {
                    if (value == option.value) {
                        display.innerText = option.label;
                        return display;
                    }
                }
            }
            return display;
        }

        display.innerText = value;

        return display;
    }

    revalidateValue(value) {
        this.#vm.navigate("@current", {[this.name]: value})
    }

    createField(value, discriminator) {
        this.#linkManager.addField(this, value, discriminator, this.#isParameter);

        if (this.state === "hidden") {
            return null;
        }

        let field;

        if (this.options instanceof Array) {
            field = document.createElement("select");
            for (const option of this.options) {
                const opt = document.createElement("option");
                if (typeof option === "number" || typeof option === "string") {
                    opt.value = option;
                    opt.innerText = option;
                    if (value == option) {
                        opt.selected = true;
                    }
                } else {
                    opt.value = option.value;
                    opt.innerText = option.label;
                    if (value == option.value) {
                        opt.selected = true;
                    }
                }
                field.appendChild(opt);
            }
        } else {
            switch (this.type) {
                case 'int':
                    field = document.createElement("input");
                    field.type = "number";
                    field.step = "1";
                    field.name = this.name;
                    field.value = value;
                    if (this.min !== undefined) {
                        field.min = this.min.toString();
                    }
                    if (this.max !== undefined) {
                        field.max = this.max.toString();
                    }
                    break;
            }
        }

        if (this.label !== undefined) {
            field.placeholder = this.label;
            field.title = this.label;
        }
        if (this.revalidate) {
            field.addEventListener("change", (event) => this.revalidateValue(event.target.value));
        }

        return field;
    }
}

class VmLink {
    #vm;
    #link;
    #linkManager;

    /**
     * @param {ViewModel} vm
     * @param {Object} link
     * @param {LinkManager} linkManager
     */
    constructor(vm, link, linkManager) {
        this.#vm = vm;
        this.#link = link;
        this.#linkManager = linkManager;
    }

    /**
     * @returns {string}
     */
    get name() {
        if (["string", "number"].indexOf(typeof this.#link.name) >= 0) {
            return this.#link.name;
        }
        throw new Error("Expected name to be a string or number.");
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
     * @returns {string|null}
     */
    get slot() {
        if (this.#link.slot === undefined || this.#link.slot === null || typeof this.#link.slot === "string") {
            return this.#link.slot ?? null;
        }
        throw new Error("Expected slot to be a string or null.");
    }

    /**
     * @returns {void}
     */
    follow() {
        const {parameters, data} = this.#linkManager.getValues(this.name);
        this.#vm.navigate(this.ref, parameters, data);
    }
}


class LinkManager {
    #links;

    constructor() {
        this.#links = new Map();
    }

    #getLinkage(link, discriminator) {
        if (discriminator !== undefined) {
            link += discriminator;
        }

        let linkage = this.#links.get(link);

        if (linkage === undefined) {
            linkage = {parameters: [], data: []};
            this.#links.set(link, linkage);
        }

        return linkage;
    }

    /**
     * @param {VmSchema} schema
     * @param {HTMLInputElement|HTMLSelectElement|string|number|bigint|boolean} field
     * @param {string|number} discriminator
     * @param {boolean} isParameter
     */
    addField(schema, field, discriminator, isParameter) {
        if (schema.bind === undefined) {
            return;
        }
        if (isParameter) {
            this.#getLinkage(schema.bind, discriminator).parameters.push([schema.name, field]);
        } else {
            this.#getLinkage(schema.bind, discriminator).data.push([schema.name, field]);
        }
    }

    getValues(link, discriminator) {
        if (discriminator !== undefined) {
            link += discriminator;
        }
        const parameterValues = {};
        const dataValues = {};
        const linkage = this.#links.get(link) ?? [];
        for (const {parameters, data} of linkage) {
            for (const [name, field] of parameters) {
                if (['string', 'number', 'boolean', 'bigint'].includes(typeof field)) {
                    parameterValues[name] = field;
                } else if ("value" in field) {
                    parameterValues[name] = field.value;
                } else {
                    throw new Error(`Unable to fetch value from field ${name}.`);
                }
            }
            for (const [name, field] of data) {
                if (['string', 'number', 'boolean', 'bigint'].includes(typeof field)) {
                    dataValues[name] = field;
                } else if ("value" in field) {
                    dataValues[name] = field.value;
                } else {
                    throw new Error(`Unable to fetch value from field ${name}.`);
                }
            }
        }

        return {parameters: parameterValues, data: dataValues};
    }
}

globalThis.viewModel = new ViewModel();
await globalThis.viewModel.navigate("@default");
