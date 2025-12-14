<script lang="ts">
	import { goto } from '$app/navigation';
	import { logout, tryLogin } from '$lib/signer';
	import { clearState, nostrState } from '$lib/state.svelte';
	import { subscribe, unsubscribe } from '$lib/timelines/base_timeline';
	import { getSetting, setSetting } from '$lib/util';
	import { onMount } from 'svelte';

	let loadImage = $state(getSetting('load-image') === 'true' ? true : false);

	onMount(async () => {
		if (!(await tryLogin())) {
			goto('/login');
			return;
		}

		await subscribe();
	});

	function handleClickLoginImage() {
		loadImage = !loadImage;
		setSetting('load-image', loadImage ? 'true' : 'false');
	}

	function handleLogout() {
		unsubscribe();
		clearState();
		logout();
		goto('/login');
	}
</script>

<h1 class="text-lg font-bold">設定</h1>

<div class="border border-thin rounded-md p-2 mt-2">
	<div>
		<span class="inline-block mr-2">画像をロードする:</span>
		<input type="checkbox" bind:checked={loadImage} onclick={handleClickLoginImage} />
	</div>

	<hr class="my-4" />

	<div>
		<button
			class="p-2 text-center bg-light dark:bg-dark border-dark dark:border-light border rounded-md"
			onclick={handleLogout}>ログアウト</button
		>
	</div>
</div>
