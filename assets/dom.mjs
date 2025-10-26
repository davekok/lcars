import {assets} from "/assets/assets.mjs";

/**
 * Update the state based on history back event.
 * @param event
 * @return {Promise<void>}
 */
function popStateEventListener(event) {
    if (event.state instanceof Object) {
        globalThis.viewModel.update(event.state);
    }
}
globalThis.addEventListener("popstate", popStateEventListener);

History.prototype.updateState = function(command, state) {
    switch (command) {
        case "push":
            this.pushState(state, "");
            break;

        case "replace":
            this.replaceState(state, "");
            break;

        case "back":
            globalThis.removeEventListener("popstate", popStateEventListener);
            this.back();
            this.replaceState(state, "");
            globalThis.addEventListener("popstate", popStateEventListener);
            break;

        case "ignore":
            break;
    }
}

Document.prototype.updateLanguage = function(value) {
    if (typeof value === "string") {
        this.documentElement.lang = value;
    }
}

Document.prototype.updateTitle = function(value) {
    this.title = typeof value === "string" ? value : "";
}

Document.prototype.updateDescription = function(value) {
    const description = this.querySelector('head>meta[name=description]');
    if (description) {
        if (typeof value === "string") {
            description.content = value;
        } else {
            description.remove();
        }
    } else {
        if (typeof value === "string") {
            const description = this.createElement("meta");
            description.name = "description";
            description.content = value;
            this.head.appendChild(description);
        }
    }
}

Document.prototype.updateTheme = function(value) {
    if (typeof value === "string") {
        this.documentElement.className = `theme-${value}`;
    }
}

Document.prototype.updateIcon = function(value) {
    if (typeof value !== "string") {
        return;
    }

    const iconElement = this.querySelector('head>link[rel=icon]');
    const iconHref = assets.icon(value);
    if (iconElement) {
        iconElement.href = iconHref;
    } else {
        const iconElement = this.createElement("link");
        iconElement.rel = "icon";
        iconElement.href = iconHref;
        this.head.appendChild(iconElement);
    }
}

/**
 * Determines where web component modules are downloaded from. Could also be used for versioning.
 *
 * Module Template URL: /assets/{design}/{component}.mjs
 * Thema Template URL: /assets/{design}/theme.css
 * Icon Template URL: /assets/{design}/{icon}.ico
 * Template HTML Tag: {design}-{component}
 *
 * @param {string} value
 */
Document.prototype.updateDesign = function(value) {
    if (typeof value !== "string") {
        return;
    }
    assets.design = value;

    const stylesheet = this.querySelector('head>link[rel=stylesheet]');
    const styleHref = assets.theme;
    if (stylesheet) {
        stylesheet.href = styleHref;
    } else {
        const stylesheet = this.createElement("link");
        stylesheet.rel = "stylesheet";
        stylesheet.href = styleHref;
        this.head.appendChild(stylesheet);
    }

    assets.tag("view").then((tag)=>{
        const oldViewElement = this.body.firstElementChild;
        if (oldViewElement?.equals(tag)) {
            return;
        }
        const view = this.createElement(tag);
        this.body.replaceFirstElementChild(view);
    });
}

/**
 * @param {string} tag
 * @return {boolean}
 */
Node.prototype.equals = function(tag) {
    return this.nodeName.toLowerCase() === tag.toLowerCase();
}

Element.prototype.replaceFirstElementChild = function(element) {
    const existing = this.firstElementChild;
    if (existing) {
        existing.replaceWith(element);
    } else {
        this.appendChild(element);
    }
};

Element.prototype.replaceElementChild = function(index, element) {
    const existing = this.children.item(index);
    if (existing) {
        existing.replaceWith(element);
    } else {
        this.appendChild(element);
    }
}

Element.prototype.getElementChildOrCreate = function(index, tag) {
    let element = this.children.item(index)
    if (element === null) {
        element = document.createElement(tag);
        this.appendChild(element);
    }
    return element;
}

Element.prototype.truncateElementChildren = function(length) {
    for (let d = this.children.length - 1; d >= length; --d) {
        this.children.item(d).remove();
    }
}

/**
 * @param {VmSchema} schema
 * @param {any} value
 */
HTMLInputElement.prototype.connectSchema = function(schema, value) {
    switch (schema.type) {
        case 'int':
            this.type = "number";
            this.step = "1";
            this.min = schema.min !== undefined ? schema.min.toString() : "";
            this.max = schema.max !== undefined ? schema.max.toString() : "";
            break;
        case 'string':
            this.pattern = schema.pattern !== undefined ? schema.pattern : "";
            break;
    }
    this.name = schema.name;
    this.value = value;
    this.placeholder = schema.label !== undefined ? schema.label : "";
    this.onchange = schema.revalidate ? (event) => schema.revalidateValue(event.target.value) : null;
}

/**
 * @param {VmSchema} schema
 * @param {any} value
 */
HTMLSelectElement.prototype.connectSchema = function(schema, value) {
    switch (schema.type) {
        case 'int':
            this.type = "number";
            this.step = "1";
            this.min = schema.min !== undefined ? schema.min.toString() : "";
            this.max = schema.max !== undefined ? schema.max.toString() : "";
            break;
        case 'string':
            this.pattern = schema.pattern !== undefined ? schema.pattern : "";
            break;
    }
    this.name = schema.name;
    this.value = value;
    this.placeholder = schema.label !== undefined ? schema.label : "";
    this.onchange = schema.revalidate ? (event) => schema.revalidateValue(event.target.value) : null;
}
