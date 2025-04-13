import type { AutoI18N, TOptions, TValue } from "$lib/auto-i18n"
import I18NEditorDialog, {
	type EditorCloseRadio,
	type EditorOpenRadio,
} from "$lib/auto-i18n/I18NEditorDialog.svelte"
import { mount, unmount } from "svelte"
import { createRadio } from "$lib/radio"
import { on } from "svelte/events"
import { noop } from "@terrygonguet/utils"
import { safeParse } from "@terrygonguet/utils/json"

const html = String.raw

export class AutoI18NEditor {
	i18n: AutoI18N

	#dialogOpenRadio: EditorOpenRadio = createRadio()
	#dialogCloseRadio: EditorCloseRadio = createRadio()
	#dialogEl: {}

	#onDestroy = noop

	constructor(i18n: AutoI18N, { autoload = false } = {}) {
		this.i18n = i18n

		const off = on(
			document,
			"click",
			(evt) => {
				const target = evt.target as HTMLElement
				if (target.matches("span.i18n-fragment")) this.onClick(evt)
			},
			{ capture: true },
		)

		this.#dialogEl = mount(I18NEditorDialog, {
			target: document.body,
			context: new Map<string, any>([
				["editor", this],
				["i18n", this.i18n],
			]),
			props: {
				autoload,
				open: this.#dialogOpenRadio.reciever,
				close: this.#dialogCloseRadio.reciever,
			},
		})

		this.#onDestroy = () => {
			off()
			unmount(this.#dialogEl)
		}
	}

	render(text: string, category: string, key: string, values: NonNullable<TOptions["values"]>) {
		return html`<span
			class="i18n-fragment"
			data-i18n-category="${category}"
			data-i18n-key="${key}"
			data-i18n-values="${encodeURIComponent(JSON.stringify(values))}"
		>
			${text}
		</span>`
	}

	onClick(evt: Event) {
		evt.stopPropagation()
		evt.preventDefault()
		const button = evt.target as HTMLButtonElement
		const { i18nCategory, i18nKey, i18nValues } = button.dataset
		const values = safeParse(decodeURIComponent(i18nValues!), {})
		this.#dialogOpenRadio.emitter(i18nCategory!, i18nKey!, values, button)
	}

	destroy() {
		this.#onDestroy()
	}
}
