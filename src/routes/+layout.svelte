<script lang="ts">
	import './layout.css';
	import { Bell, House, LogOut } from '@lucide/svelte';
	import ThemeButton from '$lib/components/ThemeButton.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { clearState } from '$lib/state.svelte';
	import type { LayoutProps } from './$types';
	import { subscribe, unsubscribe } from '$lib/timelines/base_timeline';
	import { browser } from '$app/environment';
	import { page } from '$app/state';

	let { children, data }: LayoutProps = $props();

	onMount(() => {
		if (page.url.pathname === '/login' && data.authoricated) {
			goto('/');
		} else if (page.url.pathname !== '/login' && !data.authoricated) {
			goto('/login');
		}

		if (data.signer !== undefined && data.pubkey !== undefined) {
			subscribe(data.signer, data.pubkey);
		}

		return () => {
			unsubscribe();
			clearState();
		};
	});

	function handleLogout() {
		unsubscribe();
		clearState();

		if (browser) {
			localStorage.removeItem('login');
		}

		setTimeout(() => goto('/login'), 0);
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
		<li id="home-btn" class={['mx-3', !data.authoricated && 'hidden']}>
			<a href="/" class="text-lg"><House /></a>
		</li>

		<li id="notifications-btn" class={['mx-3', !data.authoricated && 'hidden']}>
			<a href="/notifications" class="text-lg"><Bell /></a>
		</li>

		<li id="logout-btn" class={['mx-3', !data.authoricated && 'hidden']}>
			<button class="text-lg block" onclick={handleLogout}><LogOut /></button>
		</li>
	</ul>
	<div class="pr-1">
		<ThemeButton />
	</div>
</header>

<div id="main" class="bg-light dark:bg-dark text-dark dark:text-light max-w-3xl mx-auto p-2">
	{@render children()}
</div>
