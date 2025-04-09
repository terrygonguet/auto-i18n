import { db, schema } from "$lib/server/db"
import { fail } from "@sveltejs/kit"

export const actions = {
	async default({ request, params }) {
		const data = await request.formData()

		const key = data.get("key")
		if (typeof key != "string" || !key) return fail(400, { missingKey: true })

		const value = data.get("value")
		if (typeof value != "string" || !value) return fail(400, { key, missingValue: true })

		await db
			.insert(schema.translations)
			.values({ lang: params.lang, category: params.category, key: key, value: value })
			.onConflictDoUpdate({
				target: [schema.translations.lang, schema.translations.category, schema.translations.key],
				set: { value: value },
			})

		return { key, value, success: true }
	},
}
