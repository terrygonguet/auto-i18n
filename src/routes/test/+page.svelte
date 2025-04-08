<script>
	import { fadeParams } from "$lib/transition"
	import { fade } from "svelte/transition"
</script>

<main in:fade={fadeParams.in} out:fade={fadeParams.out} class="prose mx-auto my-12">
	<h2>Lorem ipsum</h2>
	<p>
		Ipsum adipisicing ipsum laborum do Lorem est. Et commodo nostrud commodo sint occaecat
		adipisicing ullamco in irure ut sit non do. Esse minim nulla et velit. Excepteur consectetur
		excepteur est ea sint nisi culpa. Proident pariatur do pariatur tempor incididunt ex dolore ex
		irure. Pariatur enim officia voluptate do esse excepteur amet ad consequat eu. Quis ea et
		reprehenderit quis consequat non tempor officia sit consequat exercitation aliquip.
	</p>
</main>
