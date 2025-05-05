<script lang="ts">
	import { page } from "$app/state"
	import { fadeParams } from "$minilib/transition.js"
	import { fade } from "svelte/transition"
	import type { PageData } from "./$types.js"

	const { t } = $derived(page.data) as PageData
</script>

<svelte:head>
	<title>{t("home", "page_title", { editor: false })}</title>
</svelte:head>

<main in:fade={fadeParams.in} out:fade={fadeParams.out} class="py-12">
	<div class="prose mx-auto w-full">
		<h1>{@html t("home", "h1")}</h1>
		<h2>{@html t("home", "what_heading")}</h2>
		<p>{@html t("home", "what_p1", { editor: { multiline: true } })}</p>
		<p>{@html t("home", "what_p2", { editor: { multiline: true } })}</p>
		<p>{@html t("home", "what_p3", { editor: { multiline: true } })}</p>
		<h2>{@html t("home", "why_heading")}</h2>
		<p>{@html t("home", "why_p1", { editor: { multiline: true } })}</p>
		<p>{@html t("home", "why_p2", { editor: { multiline: true } })}</p>
		<p>{@html t("home", "why_p3", { editor: { multiline: true } })}</p>
		<h2>{@html t("home", "how_heading")}</h2>
		<p>{@html t("home", "how_p1", { editor: { multiline: true } })}</p>
		<p>{@html t("home", "how_p2", { editor: { multiline: true } })}</p>
	</div>
</main>
