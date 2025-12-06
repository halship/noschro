<script lang="ts">
	import './layout.css';
	import { House } from '@lucide/svelte';
	import ThemeButton from '$lib/ThemeButton.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<title>ノスクロ</title>
</svelte:head>

<header class="bg-light dark:bg-dark border-thin text-dark dark:text-light border-b p-1 inset-x-0 top-0 sticky flex">
	<ul class="flex-auto flex items-center pl-1">
		<li class="mr-2">
			<a href="/" class="text-lg"><House /></a>
		</li>
	</ul>
	<div class="pr-1">
		<ThemeButton />
	</div>
</header>

<div id="main" class="bg-light dark:bg-dark text-dark dark:text-light max-w-3xl mx-auto p-2">
	{@render children()}
</div>
