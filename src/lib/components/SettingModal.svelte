<script lang="ts">
	import { browser } from '$app/environment';
	import { signin, signout } from '$lib/client';
	import { getSetting, removeSetting, setSetting } from '$lib/settings';
	import { uiState } from '$lib/state.svelte';
	import { subscribeTimeline, unsubscribeTimeline } from '$lib/subscriptions/timeline';
	import { X } from '@lucide/svelte';

	let selectedTheme: string = $state(getSetting('theme') ?? 'system');

	let isLogin: boolean = $state(getSetting('login') === '<NIP-07>');

	function handleClose() {
		uiState.isOpendedSettings = false;
	}

	async function handleLogin() {
		setSetting('login', '<NIP-07>');

		const client = await signin();
		isLogin = true;
		uiState.isOpendedSettings = false;

		unsubscribeTimeline();
		subscribeTimeline(client);
	}

	async function handleLogout() {
		removeSetting('login');
		const client = signout();
		isLogin = false;
		uiState.isOpendedSettings = false;

		unsubscribeTimeline();
		subscribeTimeline(client);
	}

	function handleChangeTheme() {
		const theme =
			selectedTheme === 'system'
				? matchMedia('(prefers-color-scheme: dark)').matches
					? 'dark'
					: 'light'
				: selectedTheme;
		document.documentElement.dataset.theme = theme;

		if (browser) {
			localStorage.setItem('theme', selectedTheme);
		}
	}
</script>

<dialog
	class="fixed top-14 mx-auto my-2 flex w-xl flex-col border-2 border-gray-400 bg-gray-200 text-gray-700 outline-4 outline-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:outline-gray-900"
>
	<div class="flex border-b border-gray-400 bg-gray-300 dark:border-gray-700 dark:bg-gray-800">
		<div class="m-2 flex-1">設定</div>
		<button
			class="block flex-none cursor-pointer border-l border-gray-400 p-2 dark:border-gray-700"
			onclick={handleClose}><X /></button
		>
	</div>

	<div class="flex items-center p-2">
		<div class="mr-3">認証</div>
		{#if isLogin}
			<button
				onclick={handleLogout}
				class="cursor-pointer rounded-md border border-gray-400 bg-gray-300 p-2 dark:border-gray-700 dark:bg-gray-800"
				>ログアウト</button
			>
		{:else}
			<button
				onclick={handleLogin}
				class="cursor-pointer rounded-md border border-gray-400 bg-gray-300 p-2 dark:border-gray-700 dark:bg-gray-800"
				>ログイン</button
			>
		{/if}
	</div>

	<hr class="my-2 dark:text-gray-700" />

	<div class="flex items-center p-2">
		<div class="mr-3">テーマ</div>
		<select
			bind:value={selectedTheme}
			class="rounded-md bg-gray-200 dark:bg-gray-900 dark:text-gray-400"
			onchange={handleChangeTheme}
		>
			<option value="system">システム</option>
			<option value="light">ライト</option>
			<option value="dark">ダーク</option>
		</select>
	</div>
</dialog>
