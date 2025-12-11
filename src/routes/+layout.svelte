<script lang="ts">
	import './layout.css';
	import { Bell, House, LogOut } from '@lucide/svelte';
	import ThemeButton from '$lib/ThemeButton.svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { connectNostr, disconnectNostr } from '$lib/subscription';
	import { nostrState } from '$lib/state.svelte';

	let { children } = $props();

	onMount(() => {
		setTimeout(async () => {
			if (!(await connectNostr())) {
				disconnectNostr();
				nostrState.authoricated = false;
				goto('/login');
			} else {
				nostrState.authoricated = true;
			}
		}, 0);

		return () => {
			disconnectNostr();
			nostrState.authoricated = false;
		};
	});

	function logout() {
		if (browser) {
			localStorage.removeItem('login');
			disconnectNostr();
			nostrState.authoricated = false;
			setTimeout(() => goto('/login'), 0);
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
		<li id="home-btn" class={['mx-3', !nostrState.authoricated && 'hidden']}>
			<a href="/" class="text-lg"><House /></a>
		</li>

		<li id="notifications-btn" class={['mx-3', !nostrState.authoricated && 'hidden']}>
			<a href="/notifications" class="text-lg"><Bell /></a>
		</li>

		<li id="logout-btn" class={['mx-3', !nostrState.authoricated && 'hidden']}>
			<button class="text-lg block" onclick={logout}><LogOut /></button>
		</li>
	</ul>
	<div class="pr-1">
		<ThemeButton />
	</div>
</header>

<div id="main" class="bg-light dark:bg-dark text-dark dark:text-light max-w-3xl mx-auto p-2">
	{@render children()}
</div>
