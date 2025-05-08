<script lang="ts">
	import { page } from "$app/state"
	import { fadeParams } from "$minilib/transition.js"
	import { fade } from "svelte/transition"
	import type { PageData, PageProps } from "./$types.js"

	const { i18n } = $derived(page.data) as PageData
	let { data }: PageProps = $props()
</script>

<svelte:head>
	<title>{i18n.t("home", "page_title", { editor: false })}</title>
</svelte:head>

<main in:fade={fadeParams.in} out:fade={fadeParams.out} class="py-12">
	<div class="prose mx-auto w-full">{@html i18n.c(data.content)}</div>
</main>
