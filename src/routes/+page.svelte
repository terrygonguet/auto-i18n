<script>
	import { fadeParams } from "$lib/transition"
	import { fade } from "svelte/transition"
</script>

<main in:fade={fadeParams.in} out:fade={fadeParams.out} class="prose mx-auto my-12">
	<h2>Auto-i18n</h2>
	<p>
		Id velit officia nostrud ipsum non reprehenderit fugiat incididunt. Ullamco dolor cupidatat
		dolore et cupidatat adipisicing culpa elit. Elit aliquip occaecat ex ea aliqua voluptate est id.
	</p>
	<p>
		Non nulla dolor sint excepteur laborum qui. Aliquip in est excepteur deserunt elit ad et
		deserunt. Adipisicing veniam sit magna dolor exercitation aute nisi eu irure sit. Commodo
		aliquip irure ullamco proident cupidatat veniam sint occaecat exercitation reprehenderit
		pariatur enim occaecat. Ea irure in qui elit veniam ut enim ad Lorem consequat. Nulla pariatur
		pariatur reprehenderit id do Lorem do.
	</p>
</main>
