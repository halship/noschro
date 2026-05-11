<script lang="ts">
	import { appState } from '$lib/state.svelte';
	import type { PageProps } from './$types';
	import Content from '$lib/components/Content.svelte';
	import UserAvatar from '$lib/components/UserAvatar.svelte';
	import { parseContent } from '$lib/models/token';
	import { requestProfiles } from '$lib/subscriptions/profiles';
	import { getContentUsers, getQuotes } from '$lib/models/common';
	import { useNostrSubscriptions } from '$lib/subscriptions/lifecycle';

	let { data }: PageProps = $props();

	let profile = $derived(appState.profilesByPubkey[data.pubkey]);

	let quotes = $derived(
		profile
			? getQuotes(appState.eventsById, appState.profilesByPubkey, profile.quoteIds)
			: undefined
	);

	let users = $derived(
		profile ? getContentUsers(appState.profilesByPubkey, profile.contentPubkeys) : undefined
	);

	useNostrSubscriptions(['profiles', 'events'], {
		onReady: () => {
			if (!(data.pubkey in appState.profilesByPubkey)) {
				requestProfiles([data.pubkey]);
			}
		}
	});
</script>

<div class="relative mb-2">
	{#if profile?.banner}
		<img
			src={profile.banner}
			aria-hidden="true"
			alt="User banner"
			class="h-60 w-full border-b object-cover"
		/>
	{:else}
		<div class="h-60 w-full border-b"></div>
	{/if}

	<UserAvatar
		pubkey={data.pubkey}
		picture={profile?.picture}
		alt="User picture"
		class="absolute bottom-2 left-2 h-30 w-30 rounded-full border-2"
	/>
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
	<p class="px-2 pb-2 wrap-anywhere break-all whitespace-pre-wrap">
		<Content tokens={parseContent(profile.about, profile.tags)} {quotes} {users} />
	</p>
{/if}
