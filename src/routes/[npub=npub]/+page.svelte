<script lang="ts">
	import { pubkeyToColor } from '$lib/formatter';
	import { appState } from '$lib/state.svelte';
	import { User } from '@lucide/svelte';
	import type { PageProps } from './$types';
	import PostContent from '$lib/components/PostContent.svelte';
	import { parseContent } from '$lib/models/content_token';
	import { onMount } from 'svelte';
	import { initNostr } from '$lib/client';
	import { GLOBAL_RELAY } from '$lib/constants';
	import { requestProfiles, subscribeProfiles } from '$lib/subscriptions/profiles';

	let { data }: PageProps = $props();

	let profile = $derived(appState.profilesByPubkey[data.pubkey]);

	onMount(() => {
		initNostr([...GLOBAL_RELAY]);
		const unsubscribeProfiles = subscribeProfiles();

		if (!(data.pubkey in appState.profilesByPubkey)) {
			requestProfiles([data.pubkey]);
		}

		return () => {
			unsubscribeProfiles();
		};
	});
</script>

<div class="relative mb-2">
	{#if profile?.banner}
		<img
			src={profile.banner}
			aria-hidden="true"
			alt="User banner"
			class="h-60 w-full border-b border-gray-600 bg-gray-900 object-cover"
		/>
	{:else}
		<div class="h-60 w-full border-b border-gray-600 bg-gray-900"></div>
	{/if}

	{#if profile?.picture}
		<img
			src={profile.picture}
			aria-hidden="true"
			alt="User picture"
			class="absolute bottom-2 left-2 h-30 w-30 rounded-full border-2 border-gray-600"
		/>
	{:else}
		<div
			class="absolute bottom-2 left-2 h-30 w-30 rounded-full border-2 border-gray-600"
			style:background-color={pubkeyToColor(data.pubkey)}
		>
			<User class="h-full w-full rounded-full text-gray-900" />
		</div>
	{/if}
</div>

{#if profile?.displayName}
	<h1 class="m-2 text-3xl font-bold">
		{profile.displayName}
	</h1>
{/if}

{#if profile?.name}
	<p class="m-2">@{profile.name}</p>
{/if}

{#if profile?.about}
	<PostContent contentTokens={parseContent(profile.about)} />
{/if}
