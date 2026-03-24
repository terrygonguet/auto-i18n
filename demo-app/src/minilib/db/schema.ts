import { sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core"

export const translations = sqliteTable(
	"translations",
	{
		lang: text("lang").notNull(),
		category: text("category").notNull(),
		key: text("key").notNull(),
		value: text("value").notNull(),
	},
	(table) => [primaryKey({ columns: [table.lang, table.category, table.key] })],
)
