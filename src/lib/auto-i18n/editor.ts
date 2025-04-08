import { createSubscriber } from "svelte/reactivity"
import type { AutoI18N } from "$lib/auto-i18n"

const html = String.raw

export class AutoI18NEditor {
	i18n: AutoI18N
	#subscribe: ReturnType<typeof createSubscriber>
	#change = () => {}

	#dialog: HTMLDialogElement

	constructor(i18n: AutoI18N) {
		this.i18n = i18n
		this.#subscribe = createSubscriber((update) => {
			this.#change = update
		})

		const dialog = document.querySelector<HTMLDialogElement>("dialog#i18n-editor")
		if (dialog) this.#dialog = dialog
		else {
			this.#dialog = document.createElement("dialog")
			this.#dialog.id = "i18n-editor"
			globalThis.i18nEditor_onsubmit = this.onSubmit.bind(this)
			globalThis.i18nEditor_onclick = this.onClick.bind(this)
			document.body.appendChild(this.#dialog)
		}
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

		this.#dialog.innerHTML = html`<form onsubmit="i18nEditor_onsubmit(event)">
			<p>Category: <code>${i18nCategory}</code> / Key: <code>${i18nKey}</code></p>
			<input id="i18-editor-lang" name="lang" value="${i18nLang}" type="hidden" required />
			<input
				id="i18-editor-category"
				name="category"
				value="${i18nCategory}"
				type="hidden"
				required
			/>
			<input id="i18-editor-key" name="key" value="${i18nKey}" type="hidden" required />
			<label for="i18n-editor-value">Value</label>
			<input id="i18-editor-value" name="value" value="${i18nValue}" type="text" required />
			<button type="submit">Save</button>
		</form>`

		this.#dialog.showModal()
	}

	onSubmit(evt: SubmitEvent) {
		evt.preventDefault()
		const data = new FormData(evt.target as HTMLFormElement, evt.submitter)
		const { lang, category, ...json } = Object.fromEntries(data)
		fetch(`/locale/${lang}/${category}.json`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(json),
		}).then((res) => {
			if (res.ok) {
				this.i18n.load(category as string)
				this.#dialog.close()
			} else return res.json().then(console.error)
		})
	}
}
