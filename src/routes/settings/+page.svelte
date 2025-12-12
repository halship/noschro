<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { configLoadImage } from '$lib/consts';
	import { tryLogin } from '$lib/signer';
	import { subscribe } from '$lib/timelines/base_timeline';
	import { getLoadImage } from '$lib/util';
	import { onMount } from 'svelte';

	let loadImage = $state(getLoadImage());

	onMount(async () => {
		if (!(await tryLogin())) {
			goto('/login');
			return;
		}

		await subscribe();
	});

	function handleClickLoginImage() {
		loadImage = !loadImage;

		if (browser) {
			localStorage.setItem(configLoadImage, loadImage ? 'true' : 'false');
		}
	}
</script>

<h1 class="text-lg font-bold">Settings</h1>

<div class="border border-thin rounded-md p-2 mt-2">
	<div>
		<span class="inline-block mr-2">画像をロードする:</span>
		<input type="checkbox" bind:checked={loadImage} onclick={handleClickLoginImage} />
	</div>
</div>
