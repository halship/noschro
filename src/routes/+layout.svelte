<script lang="ts">
	import './layout.css';
	import { Bell, House, LogOut, Moon, Sun } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { onDestroy } from 'svelte';
	import { clearState, nostrState } from '$lib/state.svelte';
	import type { LayoutProps } from './$types';
	import { unsubscribe } from '$lib/timelines/base_timeline';
	import { browser } from '$app/environment';
	import { logout } from '$lib/signer';

	let { children }: LayoutProps = $props();

	let theme: string = $state(
		browser && localStorage.getItem('theme') !== null ? localStorage.getItem('theme')! : 'light'
	);

	onDestroy(() => {
		unsubscribe();
		clearState();
	});

	function handleLogout() {
		unsubscribe();
		clearState();
		logout();
		goto('/login');
	}

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
	class="bg-light dark:bg-dark border-thin text-dark dark:text-light border-b p-1 inset-x-0 top-0 sticky flex"
>
	<ul class="flex-auto flex items-center pl-1">
		<li id="home-btn" class="mx-3" class:hidden={!nostrState.isAuthoricated}>
			<a href="/" class="text-lg"><House /></a>
		</li>

		<li id="notifications-btn" class="mx-3" class:hidden={!nostrState.isAuthoricated}>
			<a href="/notifications" class="text-lg"><Bell /></a>
		</li>

		<li id="logout-btn" class="mx-3" class:hidden={!nostrState.isAuthoricated}>
			<button class="text-lg block" onclick={handleLogout}><LogOut /></button>
		</li>
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
