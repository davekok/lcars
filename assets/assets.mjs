class Assets {
    design;

    get baseUrl() {
        return `/assets/${this.design}`;
    }

    get theme() {
        return `${this.baseUrl}/theme.css`;
    }

    icon(name) {
        return `${this.baseUrl}/${name}.ico`;
    }

    /**
     * @param {string} name
     * @return {Promise<string>}
     */
    async tag(name) {
        return import(`${this.baseUrl}/${name}.mjs`).then(() => `${this.design}-${name}`);
    }
}

export const assets = new Assets();
