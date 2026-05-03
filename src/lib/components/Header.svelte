<script lang="ts">
	import { Settings } from '@lucide/svelte';
	import { resolve } from '$app/paths';

	type TabId = 'timeline' | 'notifications';

	let activeTab: TabId = $derived.by(() => {
		return 'timeline';
	});
</script>

<header class="sticky top-0 flex border-b border-gray-600 bg-gray-900">
	<div class="flex flex-1">
		<a href={resolve('/')} class="flex-none p-3" class:active-tab={activeTab === 'timeline'}
			>タイムライン</a
		>
	</div>
	<div>
		<button class="flex-none p-3 text-gray-400 hover:text-gray-200"><Settings /></button>
	</div>
</header>

<style>
	.active-tab {
		color: var(--color-gray-200);
		font-weight: bold;
		border-bottom: 3px solid var(--color-gray-600);
	}
</style>
