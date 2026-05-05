<script lang="ts">
	import { initNostr } from '$lib/client';
	import PostItem from '$lib/components/PostItem.svelte';
	import ReplyPreview from '$lib/components/ReplyPreview.svelte';
	import { GLOBAL_RELAY, LOAD_LIMIT, TIMELINE_LIMIT } from '$lib/constants';
	import { toTimelineItem } from '$lib/models/timeline';
	import { appState } from '$lib/state.svelte';
	import { subscribeEvents } from '$lib/subscriptions/events';
	import { requestOldGlobalTimeline, subscribeGlobalTimeline } from '$lib/subscriptions/timeline';
	import { subscribeProfiles } from '$lib/subscriptions/profiles';
	import { onMount } from 'svelte';
	import { now } from 'rx-nostr';

	let timelineItems = $derived(
		appState.timelineIds
			.map((id) => toTimelineItem(appState.eventsById, appState.profilesByPubkey, id))
			.filter((item) => item !== undefined)
	);

	let canLoadOldTimeline = $derived(timelineItems.length < TIMELINE_LIMIT);

	let lastTimestamp = $derived(
		timelineItems.length > 0 ? timelineItems[timelineItems.length - 1].post.createdAt : now()
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

	function handleLoadMore() {
		requestOldGlobalTimeline(lastTimestamp, LOAD_LIMIT);
	}
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

{#if canLoadOldTimeline}
	<button class="w-full bg-sub-bg p-2 text-center" onclick={handleLoadMore}>▼さらに読み込む▼</button
	>
{/if}
