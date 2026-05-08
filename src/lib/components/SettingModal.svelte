<script lang="ts">
	import { browser } from '$app/environment';
	import { X } from '@lucide/svelte';

	type Props = {
		handleOpenSettings: () => void;
	};

	let { handleOpenSettings }: Props = $props();

	let selectedTheme: string = $state(
		browser ? (localStorage.getItem('theme') ?? 'system') : 'system'
	);

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
			class="block flex-none border-l border-gray-400 p-2 dark:border-gray-700"
			onclick={handleOpenSettings}><X /></button
		>
	</div>

	<div class="flex items-center p-2">
		<div class="mr-3">テーマ</div>
		<select
			bind:value={selectedTheme}
			class="bg-gray-200 dark:bg-gray-900 dark:text-gray-400"
			onchange={handleChangeTheme}
		>
			<option value="system">システム</option>
			<option value="light">ライト</option>
			<option value="dark">ダーク</option>
		</select>
	</div>
</dialog>
