import { AutoI18N } from "@terrygonguet/auto-i18n"

export const load = async ({ fetch, data: { lang, supportedLangs, fallbackLang } }) => {
	const i18n = new AutoI18N({ lang, supportedLangs, fallbackLang, fetch })
	return { i18n, t: i18n.t.bind(i18n), c: i18n.c.bind(i18n) }
}
