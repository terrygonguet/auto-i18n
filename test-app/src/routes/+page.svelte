<script>
	import { page } from "$app/state"
	import { fadeParams } from "$lib/transition"
	import { fade } from "svelte/transition"

	const { i18n, t } = $derived(page.data)
</script>

<main in:fade={fadeParams.in} out:fade={fadeParams.out} class="prose mx-auto my-12">
	<h2>{@html t("home", "title")}</h2>
	<p>{@html t("home", "p1", { editor: { multiline: true } })}</p>
	<div class="flex items-center justify-center gap-4">
		<button class="cursor-pointer border px-2 py-1" onclick={() => i18n.setLang("en")}
			>{@html t("home", "swap_to_en")}</button
		>
		<button class="cursor-pointer border px-2 py-1" onclick={() => i18n.setLang("fr")}
			>{@html t("home", "swap_to_fr")}</button
		>
	</div>
	<p>{@html t("home", "p2", { editor: { multiline: true } })}</p>
	<ul>
		<li>{@html t("home", "li", { values: { count: 0 } })}</li>
		<li>{@html t("home", "li", { values: { count: 1 } })}</li>
		<li>{@html t("home", "li", { values: { count: 2 } })}</li>
		<li>{@html t("home", "li", { values: { count: 3 } })}</li>
	</ul>
</main>
