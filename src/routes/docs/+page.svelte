<script lang="ts">
	let { data } = $props()
	let { i18n } = $derived(data)
</script>

<svelte:head>
	<title>{i18n.t("docs", "page_title", { editor: false })}</title>
</svelte:head>

<main></main>
