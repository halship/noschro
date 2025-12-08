<script lang="ts">
	import './layout.css';
	import { House, LogOut } from '@lucide/svelte';
	import ThemeButton from '$lib/ThemeButton.svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';

	let { children } = $props();

	function logout() {
		if (browser) {
			localStorage.removeItem('login');

			const logoutBtn = document.getElementById('logout-btn');
			logoutBtn?.classList.toggle('hidden', !localStorage.getItem('login'));

			const homeBtn = document.getElementById('home-btn');
			homeBtn?.classList.toggle('hidden', !localStorage.getItem('login'));

			goto('/login');
		}
	}
</script>

<svelte:head>
	<title>ノスクロ</title>
</svelte:head>

<header
	class="bg-light dark:bg-dark border-thin text-dark dark:text-light border-b p-1 inset-x-0 top-0 sticky flex"
>
	<ul class="flex-auto flex items-center pl-1">
		<li id="home-btn" class="mr-3 hidden">
			<a href="/" class="text-lg"><House /></a>
		</li>

		<li id="logout-btn" class="ml-5 mr-3 hidden">
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
