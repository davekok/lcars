const css = `
    :host {
        overflow-y: auto;

        div.table-top-bar {
            margin: 5rem 5rem 2rem;
            height: var(--stylish-vbar4-height);
            display: flex;
            flex-direction: row;
            align-items: stretch;
            justify-content: space-between;
            background: var(--theme-color-3);
            border-top-left-radius: var(--button-radius);
            padding-left: 2rem;
        }

        span.table-title {
            font-family: var(--text-font-family);
            background-color: var(--theme-color-background);
            color: var(--theme-color-7);
            padding: 0 1rem;
            vertical-align: middle;
            line-height: var(--stylish-vbar4-height);
            font-weight: bold;
            box-shadow:
                inset var(--stylish-hbar-gap-width) 0 var(--theme-color-background),
                inset calc(-1 * var(--stylish-hbar-gap-width)) 0 var(--theme-color-background),
                inset 0 var(--stylish-hbar-small-height) var(--theme-color-6),
                inset 0 calc((var(--stylish-hbar-small-height) + var(--stylish-vbar-gap-height))) var(--theme-color-background);
        }

        div.table-bottom-bar {
            margin: 2rem 5rem 5rem;
            height: var(--stylish-vbar4-height);
            display: flex;
            flex-direction: row;
            align-items: stretch;
            justify-content: space-between;
            background: var(--theme-color-5);
            border-bottom-right-radius: var(--button-radius);
        }

        table {
            margin: 2rem 5.5rem;
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

    /** @type {HTMLDivElement} */
    #tableTopBar;

    /** @type {HTMLSpanElement} */
    #tableTitle;

    /** @type {HTMLDivElement} */
    #tableBottomBar;

    /** @type {HTMLDivElement} */
    #tableBottomRightBar;

    /** @type {HTMLDivElement} */
    #tableBottomLeftBar;

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
        this.#tableTopBar = document.createElement('div');
        this.#tableTopBar.classList.add('table-top-bar');
        this.#shadow.appendChild(this.#tableTopBar);
        this.#tableTitle = document.createElement('span');
        this.#tableTitle.classList.add('table-title');
        this.#tableTopBar.appendChild(this.#tableTitle);
        this.#table = document.createElement('table');
        this.#shadow.appendChild(this.#table);
        this.#tableBottomBar = document.createElement('div');
        this.#tableBottomBar.classList.add('table-bottom-bar');
        this.#shadow.appendChild(this.#tableBottomBar);
        this.#tableBottomLeftBar = document.createElement('div');
        this.#tableBottomLeftBar.classList.add('table-bottom-left-bar');
        this.#tableBottomBar.appendChild(this.#tableBottomLeftBar);
        this.#tableBottomRightBar = document.createElement('div');
        this.#tableBottomRightBar.classList.add('table-bottom-right-bar');
        this.#tableBottomBar.appendChild(this.#tableBottomRightBar);
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
        this.#tableTitle.innerText = vmComponentModel.head.title;

        let i = 0;
        for (const schema of vmComponentModel.schema) {
            const label = schema.createLabel();
            if (!label) {
                continue;
            }
            this.#headRow.getElementChildOrCreate(i++, "th").replaceFirstElementChild(label);
        }
        this.#headRow.truncateElementChildren(i);

        i = 0;
        for (const record of vmComponentModel.data) {
            let j = 0;
            const row = this.#tbody.getElementChildOrCreate(i, "tr");
            for (const schema of vmComponentModel.schema) {
                const display = schema.createDisplay(record[schema.name], i);
                if (!display) {
                    continue;
                }
                row.getElementChildOrCreate(j++, "td").replaceFirstElementChild(display);
            }
            row.truncateElementChildren(j)
            for (const link of vmComponentModel.getLinksForSlot("table-row")) {
                row.onclick = (evt) => link.follow();
            }
            ++i;
        }
        this.#tbody.truncateElementChildren(i);

        if (!vmComponentModel.parameterSchema) {
            return;
        }

        let index = {
            "table-bottom-left-bar": 0,
            "table-bottom-right-bar": 0,
        };
        for (const schema of vmComponentModel.parameterSchema) {
            if (schema.hidden) {
                return;
            }
            switch (schema.slot) {
                case "table-bottom-left-bar":
                    this.#tableBottomLeftBar.replaceElementChild(index[schema.slot]++, schema.createField(vmComponentModel.parameters[schema.name]));
                    break;

                case "table-bottom-right-bar":
                    this.#tableBottomRightBar.replaceElementChild(index[schema.slot]++, schema.createField(vmComponentModel.parameters[schema.name]));
                    break;
            }
        }
    }
});
