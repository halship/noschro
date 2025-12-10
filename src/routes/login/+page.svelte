<script lang="ts">
	import { browser } from '$app/environment';
	import { decodeNostrURI } from 'nostr-tools/nip19';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { connectNostr, getSigner } from '$lib/subscription';
	import { nostrState } from '$lib/state.svelte';

	let nsec: string = $state('');
	let message: string | null = $state(null);

	onMount(() => {
		if (getSigner()) {
			goto('/');
		}
	});

	function loginNsec() {
		if (browser) {
			const decoded = decodeNostrURI(nsec);

			if (decoded.type === 'nsec') {
				localStorage.setItem('login', nsec);

				setTimeout(async () => {
					if (await connectNostr()) {
						nostrState.authoricated = true;
						goto('/');
					}
				}, 0);
			} else {
				message = 'Invalid nsec';
				nsec = '';
			}
		}
	}

	function loginNip07() {
		if (browser) {
			localStorage.setItem('login', 'NIP07');

			setTimeout(async () => {
				if (await connectNostr()) {
					nostrState.authoricated = true;
					goto('/');
				}
			}, 0);
		}
	}
</script>

<h1 class="text-lg font-bold">ログイン</h1>

{#if message}
	<div id="message" class="border border-thin rounded-md p-2 mt-2">
		{message}
	</div>
{/if}

<div class="border border-thin rounded-md p-2 mt-2">
	<h2 class="text-lg">■ 秘密鍵でログイン</h2>

	<input
		type="password"
		name="nsec"
		class="rounded w-full border border-dark dark:border-light p-1"
		placeholder="Please input nsec"
		bind:value={nsec}
	/>
	<button class="rounded border border-dark dark:border-light p-1 mt-2" onclick={loginNsec}
		>ログイン</button
	>

	{#if window.nostr}
		<hr class="my-5" />

		<h2 class="text-lg">■ 拡張機能でログイン</h2>
		<button class="rounded border border-dark dark:border-light p-1 mt-2" onclick={loginNip07}
			>ログイン</button
		>
	{/if}
</div>
