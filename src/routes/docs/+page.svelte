<script lang="ts">
	import { page } from "$app/state"
	import type { PageData } from "./$types.js"

	const { t } = $derived(page.data) as PageData
</script>

<svelte:head>
	<title>{t("docs", "page_title", { editor: false })}</title>
</svelte:head>

<main></main>
