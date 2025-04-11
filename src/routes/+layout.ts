import { AutoI18N } from "$lib/auto-i18n"

export const load = async ({ fetch }) => {
	const i18n = new AutoI18N({ lang: "fr", supportedLangs: ["fr", "en"], fallbackLang: "en", fetch })
	return { i18n, t: i18n.t.bind(i18n) }
}
