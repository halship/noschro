<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/components/Header.svelte';
	import SettingModal from '$lib/components/SettingModal.svelte';

	let { children } = $props();

	let isOpenedSetting = $state(false);

	function handleOpenSettings() {
		isOpenedSetting = !isOpenedSetting;
	}
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div
	class="relative mx-auto my-0 flex min-h-full max-w-2xl flex-col border border-gray-400 bg-gray-200 dark:border-gray-700 dark:bg-gray-900"
>
	<Header {handleOpenSettings} />

	<main class="flex-1f">
		{@render children()}
	</main>

	{#if isOpenedSetting}
		<SettingModal {handleOpenSettings} />
	{/if}
</div>
