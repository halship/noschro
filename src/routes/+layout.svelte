<script lang="ts">
	import './layout.css';
	import { Sun, House } from '@lucide/svelte';

	let { children } = $props();
</script>

<svelte:head>
	<title>ノスクロ -noschro-</title>
</svelte:head>

<header class="bg-light border-thin text-dark border-b p-1 inset-x-0 top-0 sticky flex">
	<ul class="flex-auto flex items-center pl-1">
		<li class="mr-2">
			<a href="/" class="text-lg"><House /></a>
		</li>
	</ul>
	<div class="pr-1">
		<button class="border border-thin rounded-full p-1"><Sun /></button>
	</div>
</header>

<div id="main" class="bg-light text-dark max-w-3xl mx-auto p-2">
	{@render children()}
</div>
