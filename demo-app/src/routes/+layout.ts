import { SvelteI18N } from "@terrygonguet/svelte-i18n"
import { i18nFetchAll, i18nFetchCategory, i18nUpdateKey } from "$lib/i18n.remote.js"

export async function load({ data }) {
	const i18n = new SvelteI18N({
		...data,
		fetchAll: i18nFetchAll,
		fetchCategory: i18nFetchCategory,
		updateKey: i18nUpdateKey,
	})
	return { i18n, t: i18n.t.bind(i18n), c: i18n.c.bind(i18n) }
}
