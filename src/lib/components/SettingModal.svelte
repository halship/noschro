<script lang="ts">
	import { browser } from '$app/environment';

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
	class="fixed top-14 mx-auto my-2 flex min-w-auto flex-col gap-1 border-2 border-gray-400 bg-gray-200 text-gray-700 outline-4 outline-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:outline-gray-900"
>
	<div class="border-b border-gray-400 bg-gray-300 p-2 dark:border-gray-700 dark:bg-gray-800">
		設定
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
