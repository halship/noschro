<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="relative mx-auto my-0 flex min-h-full max-w-3xl flex-col">
	{@render children()}
</div>
