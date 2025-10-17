const css = `
    :host form {
        display: grid;
        grid-template-columns: 5rem 10rem;
    }
    :host form>label {
        grid-column: 1;
    }
    :host form>input {
        grid-column: 2;
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

    render(vm)
    {
        this.#title.textContent = vm.head.title;
        this.#form.innerHTML = "";
        for (const field of vm.fields) {
            const label = document.createElement("label");
            const id = Math.random().toString(36).replace('0.', '');
            label.htmlFor = id;
            label.textContent = field.label;
            const input = document.createElement("input");
            input.id = id;
            input.name = field.name;
            input.type = field.type;
            input.readOnly = field.readonly ?? false;
            input.disabled = field.disabled ?? false;
            input.value = vm.data[field.name];
            this.#form.appendChild(label);
            this.#form.appendChild(input);
        }
    }
});
