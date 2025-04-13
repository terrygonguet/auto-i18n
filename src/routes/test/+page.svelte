<script>
	import { fadeParams } from "$lib/transition"
	import { fade } from "svelte/transition"
	import content from "./content.html?raw"
	import { page } from "$app/state"

	const { i18n } = $derived(page.data)
</script>

<main in:fade={fadeParams.in} out:fade={fadeParams.out} class="prose mx-auto my-12">
	{@html i18n.c(content, { url: "https://i18n.localhost/docs" })}
</main>
