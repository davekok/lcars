import {assets} from "/assets/assets.mjs";

/**
 * Update the state based on history back event.
 * @param event
 * @return {Promise<void>}
 */
function popStateEventListener(event) {
    if (event.state instanceof Object) {
        globalThis.viewModel?.update(event.state);
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
    const description = this.querySelector("head>meta[name=description]");
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
        this.body.replaceFirstElementChild(this.createElement(tag));
    });
}

/**
 * @param {string} tag
 * @param {VmSchema} schema
 * @returns {Element}
 */
Document.prototype.createLabel = function(tag, schema) {
    return this.createElement(tag).renderSchemaLabel(schema);
}

/**
 * @param {VmSchema} schema
 * @param {any} value
 */
Document.prototype.createField = function(schema, value) {
    if (schema.type === "textarea") {
        return this.createElement("textarea").renderSchema(schema, value);
    } else if (schema.options === undefined) {
        return this.createElement("input").renderSchema(schema, value);
    } else {
        return this.createElement("select").renderSchema(schema, value);
    }
}

/**
 * @param {string} tag
 * @return {boolean}
 */
Node.prototype.equals = function(tag) {
    return this.nodeName.toLowerCase() === tag.toLowerCase();
}

/**
 * @param {Element} element
 * @returns {Element}
 */
Element.prototype.replaceFirstElementChild = function(element) {
    const existing = this.firstElementChild;
    if (existing) {
        existing.replaceWith(element);
    } else {
        this.appendChild(element);
    }
    return element;
};

/**
 * @param {number} index
 * @param {Element} element
 * @returns {Element}
 */
Element.prototype.replaceElementChild = function(index, element) {
    const existing = this.children.item(index);
    if (existing) {
        existing.replaceWith(element);
    } else {
        this.appendChild(element);
    }
    return element;
}

/**
 * @param {number} index
 * @param {string} tag
 * @returns {Element}
 */
Element.prototype.getElementChildOrCreate = function(index, tag) {
    let element = this.children.item(index)
    if (element === null) {
        element = document.createElement(tag);
        this.appendChild(element);
    }
    return element;
}

/**
 * @param {number} length
 */
Element.prototype.truncateElementChildren = function(length) {
    for (let d = this.children.length - 1; d >= length; --d) {
        this.children.item(d).remove();
    }
}

HTMLLabelElement.prototype.renderSchemaLabel = function(schema) {
    this.htmlFor = schema.id;
    this.innerText = schema.label;
    return this;
}

HTMLTableCellElement.prototype.renderSchemaLabel = function(schema) {
    this.innerText = schema.label;
    return this;
}

/**
 * @param {VmSchema} schema
 * @param {any} value
 * @param {number|string|bigint|undefined} value
 */
HTMLTableCellElement.prototype.renderSchema = function(schema, value) {
    this.innerText = value;
    return this;
}

/**
 * @param {VmSchema} schema
 * @param {any} value
 * @param {number|string|bigint|undefined} value
 */
HTMLInputElement.prototype.renderSchema = function(schema, value) {
    switch (schema.type) {
        case "int":
        case "number":
        case "float":
            this.type = "number";
            this.step = "1";
            this.name = schema.name;
            this.value = value;
            if (schema.min !== undefined) {
                this.min = schema.min.toString();
            }
            if (schema.max !== undefined) {
                this.max = schema.max.toString();
            }
            break;
        case "string":
        case "text":
            this.type = "text";
            this.name = schema.name;
            this.value = value;
            if (schema.pattern !== undefined) {
                this.pattern = schema.pattern;
            }
            if (schema.maxLength !== undefined) {
                this.maxLength = schema.maxLength;
            }
            break;
    }
    this.id = schema.id;
    this.name = schema.name;
    this.value = value;
    this.placeholder = schema.label !== undefined ? schema.label : "";

    return this;
}

/**
 * @param {VmSchema} schema
 * @param {any} value
 */
HTMLSelectElement.prototype.renderSchema = function(schema, value) {
    let i = 0;
    for (const option of schema.options) {
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
        this.replaceElementChild(i++, opt);
    }
    this.truncateElementChildren(i);

    this.value = value;

    return this;
}
