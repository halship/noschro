<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/components/Header.svelte';
	import { appState } from '$lib/state.svelte';
	import SettingModal from '$lib/components/SettingModal.svelte';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="relative mx-auto my-0 flex min-h-dvh max-w-2xl flex-col border border-border bg-bg">
	<Header />

	{#if appState.isOpenedSetting}
		<SettingModal />
	{/if}

	<main class="flex-1">
		{@render children()}
	</main>
</div>
