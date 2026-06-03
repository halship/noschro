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
	<div class="mx-2">
		<div class="border-b py-2">
			<p class="font-bold">
				<span class="mr-1">display_name</span><span>@name</span>
			</p>
			<p>2026-06-03 23:37:15</p>
			<p class="mt-2">投稿内容。投稿内容。投稿内容。投稿内容。</p>
		</div>
		<div class="border-b py-2">
			<p class="font-bold">
				<span class="mr-1">display_name</span><span>@name</span>
			</p>
			<p>2026-06-03 23:37:15</p>
			<p class="mt-2">投稿内容。投稿内容。投稿内容。投稿内容。</p>
		</div>
	</div>
{:else}
	<div class="m-2">
		<button class="cursor-pointer rounded-lg border bg-gray-100 p-2" onclick={handleNip07Login}
			>NIP-07でログイン</button
		>
	</div>
{/if}
