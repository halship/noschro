<script lang="ts">
	import { decodeNostrURI } from 'nostr-tools/nip19';
	import { goto } from '$app/navigation';
	import type { PageProps } from './$types';
	import { tryLogin } from '$lib/signer';
	import { onMount } from 'svelte';

	let { data }: PageProps = $props();

	let nsec: string = $state('');
	let message: string | null = $state(null);

	onMount(async () => {
		if (await tryLogin()) {
			goto('/');
		}
	});

	function handleLoginNsec() {
		const decoded = decodeNostrURI(nsec);

		if (decoded.type === 'nsec') {
			localStorage.setItem('login', nsec);
			tryLogin().then((result) => {
				if (result) {
					goto('/');
				} else {
					message = 'Failed to login';
				}
			});
		} else {
			message = 'Invalid nsec';
			nsec = '';
		}
	}

	function handleLoginNip07() {
		localStorage.setItem('login', '<NIP-7>');
		tryLogin().then((result) => {
			if (result) {
				goto('/');
			} else {
				message = 'Failed to login';
			}
		});
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
	<button class="rounded border border-dark dark:border-light p-1 mt-2" onclick={handleLoginNsec}
		>ログイン</button
	>

	{#if data.hasNip07}
		<hr class="my-5" />

		<h2 class="text-lg">■ 拡張機能でログイン</h2>
		<button class="rounded border border-dark dark:border-light p-1 mt-2" onclick={handleLoginNip07}
			>ログイン</button
		>
	{/if}
</div>
