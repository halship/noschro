<script lang="ts">
	import { initNostr } from '$lib/client';
	import PostItem from '$lib/components/PostItem.svelte';
	import ReplyPreview from '$lib/components/ReplyPreview.svelte';
	import { LOAD_LIMIT, TIMELINE_LIMIT } from '$lib/constants';
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
		const rxNostr = initNostr();

		const unsubscribeTimeline = subscribeGlobalTimeline(rxNostr);
		const unsubscribeEvents = subscribeEvents(rxNostr);
		const unsubscribeProfiles = subscribeProfiles(rxNostr);

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
	{#if item.replyToEvent}
		<ReplyPreview post={item.replyToEvent.post} />
	{/if}

	<PostItem
		post={item.post}
		profile={item.profile}
		replyToUsers={item.replyToUsers}
		quotes={item.quotes}
	/>
{/each}

{#if canLoadOldTimeline}
	<button class="w-full bg-gray-300 p-2 text-center dark:bg-gray-800" onclick={handleLoadMore}
		>▼さらに読み込む▼</button
	>
{/if}
