<script lang="ts">
	import { Settings } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import { appState, uiState } from '$lib/state.svelte';
	import { LOAD_LIMIT } from '$lib/constants';

	type TabId = 'timeline' | 'notifications';

	let activeTab: TabId = $derived.by(() => {
		return 'timeline';
	});

	function handleClickTimelineTab() {
		if (appState.timelineIds.length > LOAD_LIMIT) {
			appState.timelineIds = appState.timelineIds.slice(0, LOAD_LIMIT);
		}
	}

	function handleToggleSettings() {
		uiState.isOpendedSettings = !uiState.isOpendedSettings;
	}
</script>

<header
	class="bg-sub-bg sticky top-0 flex border-b border-gray-400 bg-gray-300 dark:border-gray-700 dark:bg-gray-800"
>
	<div class="flex flex-1">
		<a
			href={resolve('/')}
			class="flex-none border-gray-400 p-3 dark:border-gray-600"
			class:border-b-5={activeTab === 'timeline'}
			class:font-bold={activeTab === 'timeline'}
			onclick={handleClickTimelineTab}>タイムライン</a
		>
	</div>
	<button
		class="flex-none cursor-pointer p-3 dark:hover:text-gray-300"
		onclick={handleToggleSettings}><Settings /></button
	>
</header>
