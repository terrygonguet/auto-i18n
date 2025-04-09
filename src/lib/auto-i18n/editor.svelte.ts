import { createSubscriber } from "svelte/reactivity"
import type { AutoI18N } from "$lib/auto-i18n"
import I18NEditorDialog, { type Props } from "$lib/auto-i18n/I18NEditorDialog.svelte"
import { mount } from "svelte"
import { createRadio } from "$lib/radio"

const html = String.raw

export class AutoI18NEditor {
	i18n: AutoI18N
	#subscribe: ReturnType<typeof createSubscriber>
	#change = () => {}

	#dialogOpenRadio = createRadio()
	#dialogCloseRadio = createRadio()
	#dialog = $state<Props>({
		lang: "",
		category: "",
		key: "",
		value: "",
		open: this.#dialogOpenRadio.reciever,
		close: this.#dialogCloseRadio.reciever,
	})
	#dialogEl: {}

	constructor(i18n: AutoI18N) {
		this.i18n = i18n
		this.#subscribe = createSubscriber((update) => {
			this.#change = update
		})

		this.#dialogEl = mount(I18NEditorDialog, {
			target: document.body,
			props: this.#dialog,
		})

		globalThis.i18nEditor_onclick = this.onClick.bind(this)
	}

	render(category: string, key: string) {
		this.#subscribe()
		return html`<button
			data-i18n-lang="${this.i18n.lang}"
			data-i18n-category="${category}"
			data-i18n-key="${key}"
			onclick="i18nEditor_onclick(event)"
		>
			${this.i18n.t(category, key, { autoload: false, noEditor: true })}
		</button>`
	}

	onClick(evt: Event) {
		evt.stopPropagation()
		evt.preventDefault()
		const button = evt.target as HTMLButtonElement
		const { i18nLang, i18nCategory, i18nKey } = button.dataset
		const i18nValue = button.innerText.startsWith("I18N_MISSING_") ? "" : button.innerText

		this.#dialog.lang = i18nLang!
		this.#dialog.category = i18nCategory!
		this.#dialog.key = i18nKey!
		this.#dialog.value = i18nValue
		this.#dialogOpenRadio.emitter()
	}
}
