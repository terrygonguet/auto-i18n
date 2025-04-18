import { i18nHandler } from "$minilib/i18n/index.js"

export const handle = async ({ resolve, event }) => {
	const i18nResult = await i18nHandler(event)
	if (i18nResult.handled) return i18nResult.response

	return resolve(event)
}
