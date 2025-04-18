<script>
	import { fade } from "svelte/transition"
	import content from "./content.html?raw"
	import { page } from "$app/state"
	import { fadeParams } from "$minilib/transition.js"

	const { i18n } = $derived(page.data)
</script>

<main in:fade={fadeParams.in} out:fade={fadeParams.out} class="prose mx-auto my-12">
	{@html i18n.c(content, {
		url: "https://github.com/terrygonguet/auto-i18n/blob/main/src/routes/test/content.html",
	})}
</main>
