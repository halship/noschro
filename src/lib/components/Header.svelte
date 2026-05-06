<script lang="ts">
	import { Settings } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import { appState } from '$lib/state.svelte';

	type TabId = 'timeline' | 'notifications';

	let activeTab: TabId = $derived.by(() => {
		return 'timeline';
	});

	function handleSetting() {
		appState.isOpenedSetting = !appState.isOpenedSetting;
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
			class:font-bold={activeTab === 'timeline'}>タイムライン</a
		>
	</div>
	<div>
		<button class="flex-none p-3 dark:hover:text-gray-300" onclick={handleSetting}
			><Settings /></button
		>
	</div>
</header>
