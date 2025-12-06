<script lang="ts">
	import './layout.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>ノスクロ -noschro-</title>
</svelte:head>

<header class="bg-light border-thin text-dark border-b p-1 inset-x-0 top-0 sticky">
	<h1 class="text-3xl">
		<a href="/">ノスクロ</a>
	</h1>
</header>

<div id="main" class="bg-light text-dark max-w-3xl mx-auto p-2">
	{@render children()}
</div>
