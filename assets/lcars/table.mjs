const css = `
    :host {
        overflow-y: auto;

        table {
            margin: 5rem;
            color: var(--theme-color-7);
            font-family: var(--text-font-family);
            border-spacing: 2rem 0.5rem;

            th {
                text-align: left;
            }
        }
    }
`;

customElements.define("lcars-table", class LcarsTable extends HTMLElement
{
    /** @type {ShadowRoot} */
    #shadow;

    /** @type {HTMLTableElement} */
    #table;

    /** @type {HTMLTableSectionElement} */
    #thead;

    /** @type {HTMLTableSectionElement} */
    #tbody;

    /** @type {HTMLTableRowElement} */
    #headRow;

    constructor()
    {
        super();
        this.#shadow = this.attachShadow({mode: 'closed'});
        const style = document.createElement('style');
        style.textContent = css;
        this.#shadow.appendChild(style);
        this.#table = document.createElement('table');
        this.#shadow.appendChild(this.#table);
        this.#thead = document.createElement('thead');
        this.#tbody = document.createElement('tbody');
        this.#table.appendChild(this.#thead);
        this.#table.appendChild(this.#tbody);
        this.#headRow = document.createElement('tr');
        this.#thead.appendChild(this.#headRow);
    }

    /**
     * @param {VmComponentModel} vmComponentModel
     * @returns {void}
     */
    render(vmComponentModel)
    {
        let i = 0;
        for (const schema of vmComponentModel.schema) {
            const head = this.#headRow.children.item(i++) ?? document.createElement("th");
            head.innerText = schema.label;
            if (head.parentElement === null) {
                this.#headRow.appendChild(head);
            }
        }
        for (let d = this.#headRow.children.length - 1; d > i; --d) {
            this.#headRow.children.item(d).remove();
        }

        i = 0;
        for (const record of vmComponentModel.data) {
            let j = 0;
            const row = this.#tbody.children.item(i++) ?? document.createElement("tr");
            for (const schema of vmComponentModel.schema) {
                const cell = row.children.item(j++) ?? document.createElement("td");
                cell.innerText = record[schema.name];
                if (cell.parentElement === null) {
                    row.appendChild(cell);
                }
            }
            for (let d = row.children.length - 1; d > j; --d) {
                row.children.item(d).remove();
            }
            if (row.parentElement === null) {
                this.#tbody.appendChild(row);
            }
        }
        for (let d = this.#tbody.children.length - 1; d > i; --d) {
            this.#tbody.children.item(d).remove();
        }
    }
});
