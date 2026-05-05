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

<header class="sticky top-0 flex border-b border-border bg-sub-bg">
	<div class="flex flex-1">
		<a href={resolve('/')} class="flex-none p-3" class:active-tab={activeTab === 'timeline'}
			>タイムライン</a
		>
	</div>
	<div>
		<button class="text-app-text flex-none p-3 hover:text-strong-text" onclick={handleSetting}
			><Settings /></button
		>
	</div>
</header>

<style>
	.active-tab {
		color: var(--color-app-text);
		font-weight: bold;
		border-bottom: 3px solid var(--color-border);
	}
</style>
