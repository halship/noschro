<script lang="ts">
	import './layout.css';
	import { Bell, House, LogOut, Moon, Settings, SquarePen, Sun } from '@lucide/svelte';
	import { onDestroy } from 'svelte';
	import { clearState, nostrState } from '$lib/state.svelte';
	import type { LayoutProps } from './$types';
	import { unsubscribe } from '$lib/timelines/base_timeline';
	import { browser } from '$app/environment';
	import { configTheme } from '$lib/consts';

	let { children }: LayoutProps = $props();

	let theme: string = $state(
		browser && localStorage.getItem(configTheme) !== null
			? localStorage.getItem(configTheme)!
			: 'light'
	);

	onDestroy(() => {
		unsubscribe();
		clearState();
	});

	function toggleTheme() {
		if (browser) {
			if (theme === 'light') {
				theme = 'dark';
			} else {
				theme = 'light';
			}

			localStorage.setItem('theme', theme);
			document.documentElement.classList.toggle('dark', theme === 'dark');
		}
	}
</script>

<svelte:head>
	<title>ノスクロ</title>
	<link rel="shortcut icon" href="/favicon.svg" />
</svelte:head>

<header
	class="bg-light dark:bg-dark border-thin text-dark dark:text-light border-b p-1 inset-x-0 top-0 sticky flex justify-between z-10"
>
	<div class="ml-1">
		{#if nostrState.isAuthoricated}
			<a href="/post" class="block border border-thin rounded-full p-1 text-lg"><SquarePen /></a>
		{/if}
	</div>

	<ul class="flex items-center">
		{#if nostrState.isAuthoricated}
			<li id="home-btn" class="mx-3">
				<a href="/" class="text-lg"><House /></a>
			</li>

			<li id="notifications-btn" class="mx-3">
				<a href="/notifications" class="text-lg"><Bell /></a>
			</li>

			<li id="settings-btn" class="mx-3">
				<a href="/settings" class="text-lg"><Settings /></a>
			</li>
		{/if}
	</ul>

	<div class="pr-1">
		<button class="border border-thin rounded-full p-1" onclick={toggleTheme}>
			{#if theme === 'light'}
				<Sun />
			{:else}
				<Moon />
			{/if}
		</button>
	</div>
</header>

<div id="main" class="bg-light dark:bg-dark text-dark dark:text-light max-w-3xl mx-auto p-2">
	{@render children()}
</div>
