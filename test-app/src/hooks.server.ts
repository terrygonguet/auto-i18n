import { createAutoI18NHandler } from "auto-i18n/server"

const i18nHandler = createAutoI18NHandler({
	fetchCategory: async () => void 0,
	fetchAll: async () => void 0,
	save: async () => void 0,
})

export const handle = async ({ resolve, event }) => {
	const i18nResult = await i18nHandler(event)
	if (i18nResult.handled) return i18nResult.response

	return resolve(event)
}
