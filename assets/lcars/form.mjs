const css = `
    :host {
        padding: 0 5rem;
        h1 {
            color: var(--theme-color-7);
        }
        form {
            display: grid;
            grid-template-columns: 5rem 10rem;
            grid-gap: 0.5rem 1.5rem;
            label {
                grid-column: 1;
                color: var(--theme-color-7);
            }
            input {
                grid-column: 2;
            }
        }
    }
`;

customElements.define("lcars-form", class LcarsForm extends HTMLElement
{
    #shadow;
    #title;
    #form;

    constructor()
    {
        super();
        this.#shadow = this.attachShadow({mode: 'open'});
        this.#shadow.innerHTML = `<style>${css}</style>`;
        this.#shadow.appendChild(this.#title = document.createElement("h1"));
        this.#shadow.appendChild(this.#form = document.createElement("form"));
    }

    /**
     * @param {VmComponentModel} componentModel
     */
    render(componentModel)
    {
        this.#title.textContent = componentModel.head.title;
        this.#form.innerHTML = "";
        for (const schema of componentModel.schema) {
            const value = componentModel.data[schema.name];
            if (schema.hidden) {
                schema.bind(value);
                continue;
            }
            this.#form.appendChild(document.createLabel("label", schema));
            this.#form.appendChild(schema.bind(document.createField(schema, value)));
        }
    }
});
