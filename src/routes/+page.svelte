<script lang="ts">
	import { login } from '$lib/client';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { getSetting, removeSetting, setSetting } from '$lib/settings';
	import { onMount } from 'svelte';

	let isLogin: boolean = $state(getSetting('login') !== null);

	onMount(async () => {
		if (isLogin) {
			const result = await login();

			if (!result) {
				removeSetting('login');
				isLogin = false;
				return;
			}
		}
	});

	async function handleNip07Login() {
		setSetting('login', '<NIP-07>');
		const result = await login();

		if (!result) {
			removeSetting('login');
			isLogin = false;
			return;
		}

		isLogin = true;
	}
</script>

<PageHeader title="タイムライン" />

{#if isLogin}
	<p>仮</p>
{:else}
	<div class="m-2">
		<button class="cursor-pointer rounded-lg border bg-gray-100 p-2" onclick={handleNip07Login}
			>NIP-07でログイン</button
		>
	</div>
{/if}
