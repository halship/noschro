<script lang="ts">
	import ProfileMain from '$lib/components/ProfileMain.svelte';
	import { appState } from '$lib/state.svelte';
	import { onMount } from 'svelte';
	import type { PageProps } from './$types';
	import { requestProfile, subscribeProfiles } from '$lib/subscriptions/profiles';
	import { initNostr } from '$lib/client';
	import { GLOBAL_RELAY } from '$lib/constants';

	let { data }: PageProps = $props();

	onMount(() => {
		initNostr([...GLOBAL_RELAY]);
		const unsubscribeProfiles = subscribeProfiles();

		if (data.type === 'npub' && !(data.data in appState.profilesByPubkey)) {
			requestProfile(data.data);
		}

		return () => {
			unsubscribeProfiles();
		};
	});
</script>

<svelte:head>
	{#if data.type === 'npub'}
		<title>noschro - プロフィール</title>
	{/if}
</svelte:head>

{#if data.type === 'npub' && data.data in appState.profilesByPubkey}
	<ProfileMain profile={appState.profilesByPubkey[data.data]} />
{/if}
