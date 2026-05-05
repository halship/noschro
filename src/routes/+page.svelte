<script lang="ts">
	import { initNostr } from '$lib/client';
	import PostItem from '$lib/components/PostItem.svelte';
	import ReplyPreview from '$lib/components/ReplyPreview.svelte';
	import { GLOBAL_RELAY } from '$lib/constants';
	import { toTimelineItem } from '$lib/models/timeline';
	import { appState } from '$lib/state.svelte';
	import { subscribeEvents } from '$lib/subscriptions/events';
	import { subscribeGlobalTimeline } from '$lib/subscriptions/global_timeline';
	import { subscribeProfiles } from '$lib/subscriptions/profiles';
	import { onMount } from 'svelte';

	let timelineItems = $derived(
		appState.timelineIds
			.map((id) => toTimelineItem(appState.eventsById, appState.profilesByPubkey, id))
			.filter((item) => item !== undefined)
	);

	onMount(() => {
		initNostr([...GLOBAL_RELAY]);

		const unsubscribeTimeline = subscribeGlobalTimeline();
		const unsubscribeEvents = subscribeEvents();
		const unsubscribeProfiles = subscribeProfiles();

		return () => {
			unsubscribeTimeline();
			unsubscribeEvents();
			unsubscribeProfiles();
		};
	});
</script>

<svelte:head>
	<title>noschro - タイムライン</title>
</svelte:head>

{#each timelineItems as item (item.id)}
	{#if item.replyTo}
		<ReplyPreview post={item.replyTo.post} />
	{/if}
	<PostItem post={item.post} profile={item.profile} />
{/each}
