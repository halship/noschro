<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/components/Header.svelte';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="relative mx-auto my-0 flex min-h-dvh max-w-2xl flex-col border border-gray-700">
	<Header />

	<main class="flex-1 bg-gray-900">
		{@render children()}
	</main>
</div>
