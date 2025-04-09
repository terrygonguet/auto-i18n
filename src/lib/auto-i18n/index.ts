import { asyncMap } from "@terrygonguet/utils/async"
import { safe } from "@terrygonguet/utils/result"
import { createSubscriber } from "svelte/reactivity"
import type { AutoI18NEditor } from "$lib/auto-i18n/editor.svelte"

export interface AutoI18NConstructorOptions {
	lang: string
	fetch: typeof fetch
}

export class AutoI18N {
	#fetch: typeof fetch
	#editor?: AutoI18NEditor
	#showEditor = false

	#lang: string
	#langSubscribe: ReturnType<typeof createSubscriber>
	#langChange = () => {}

	#cache = new Map<string, Record<string, string>>()
	#cacheSubscribe: ReturnType<typeof createSubscriber>
	#cacheChange = () => {}

	#failedCategories = new Set<string>()
	#inFlight = new Set<string>()

	constructor({ lang, fetch = globalThis.fetch }: AutoI18NConstructorOptions) {
		this.#lang = lang
		this.#fetch = fetch
		this.#cacheSubscribe = createSubscriber((update) => {
			this.#cacheChange = update
		})
		this.#langSubscribe = createSubscriber((update) => {
			this.#langChange = update
		})
	}

	get lang() {
		this.#langSubscribe()
		return this.#lang
	}

	async preload(categories: string[]) {
		await asyncMap(categories, (category) => this.load(category), {
			concurrent: 5,
			withSourceIndexes: false,
		})
	}

	async load(category: string) {
		const cacheKey = this.#lang + "." + category
		if (this.#failedCategories.has(cacheKey) || this.#inFlight.has(cacheKey)) return

		this.#inFlight.add(cacheKey)
		const [err, data] = await safe(this.#fetch(`/locale/${this.#lang}/${category}.json`))
			.andThen(async (res) => ({ ok: res.ok, data: await res.json() }))
			.andThen(({ ok, data }) => {
				if (!ok) throw new Error(data.message)
				else return data
			})
			.asTuple()
		this.#inFlight.delete(cacheKey)

		if (err) {
			console.error("Failed to load translations", { category, lang: this.lang }, err)
			this.#failedCategories.add(cacheKey)
		} else {
			this.#cache.set(cacheKey, data)
			this.#cacheChange()
		}
	}

	async setLang(lang: string) {
		const loaded: string[] = []
		for (const cacheKey of this.#cache.keys()) {
			if (cacheKey.startsWith(lang + ".")) {
				const category = cacheKey.slice(lang.length + 1)
				loaded.push(category)
			}
		}

		this.#lang = lang
		await this.preload(loaded)
		this.#langChange()
		this.#cacheChange()
	}

	t(category: string, key: string, { autoload = true, noEditor = false } = {}): string {
		if (this.#showEditor && this.#editor && !noEditor) {
			return this.#editor.render(category, key)
		}

		this.#cacheSubscribe()
		const cacheKey = this.#lang + "." + category
		const translations = this.#cache.get(cacheKey)
		if (!translations) {
			if (autoload && !this.#inFlight.has(cacheKey)) this.load(category)
			return "I18N_MISSING_CATEGORY"
		}
		const value = translations[key]
		if (value == undefined) return "I18N_MISSING_KEY"
		return value
	}

	async showEditor() {
		if (!this.#editor) {
			const { AutoI18NEditor } = await import("$lib/auto-i18n/editor.svelte")
			this.#editor = new AutoI18NEditor(this)
		}

		this.#showEditor = true
		this.#cacheChange()
	}

	hideEditor() {
		this.#showEditor = false
		this.#cacheChange()
	}
}
