<script lang="ts">
	import { browser } from '$app/environment';
	import { seckeySigner } from '@rx-nostr/crypto';
	import { decodeNostrURI } from 'nostr-tools/nip19';
	import { loginType, pubkey, signer } from '$lib/store';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let nsec: string = $state('');
	let message: string | null = $state(null);

	onMount(() => {
		if (browser) {
			if (localStorage.getItem('login')) goto('/');
		}
	});

	function loginNsec() {
		if (browser) {
			const decoded = decodeNostrURI(nsec);

			if (decoded.type === 'nsec') {
				localStorage.setItem('login', nsec);

				setTimeout(async () => {
					signer.set(seckeySigner(nsec));
					loginType.set('nsec');
					pubkey.set(await $signer.getPublicKey());

					const logoutBtn = document.getElementById('logout-btn');
					logoutBtn?.classList.toggle('hidden', !localStorage.getItem('login'));

					const homeBtn = document.getElementById('home-btn');
					homeBtn?.classList.toggle('hidden', !localStorage.getItem('login'));

					goto('/');
				}, 0);
			} else {
				message = 'Invalid nsec';
				nsec = '';
			}
		}
	}
</script>

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
</div>
