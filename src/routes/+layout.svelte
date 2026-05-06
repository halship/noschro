<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/components/Header.svelte';
	import SettingModal from '$lib/components/SettingModal.svelte';
	import { appState } from '$lib/state.svelte';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div
	class="relative mx-auto my-0 flex min-h-full max-w-2xl flex-col border border-gray-400 bg-gray-200 dark:border-gray-700 dark:bg-gray-900"
>
	<Header />

	<main class="flex-1f">
		{@render children()}
	</main>

	<SettingModal isOpended={appState.isOpenedSetting} />
</div>
