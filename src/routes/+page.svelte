<script lang="ts">
	import { initNostr } from '$lib/client';
	import PostItem from '$lib/components/PostItem.svelte';
	import ReplyPreview from '$lib/components/ReplyPreview.svelte';
	import { LOAD_LIMIT, TIMELINE_LIMIT } from '$lib/constants';
	import { toTimelineItem } from '$lib/models/timeline';
	import { appState } from '$lib/state.svelte';
	import {
		requestOldTimeline,
		subscribeTimeline,
		unsubscribeTimeline
	} from '$lib/subscriptions/timeline';
	import { onDestroy, onMount } from 'svelte';
	import { now } from 'rx-nostr';
	import { subscribeProfiles, unsubscribeProfiles } from '$lib/subscriptions/profiles';
	import { subscribeEvents, unsubscribeEvents } from '$lib/subscriptions/events';

	let timelineItems = $derived(
		appState.timelineIds
			.map((id) => toTimelineItem(appState.eventsById, appState.profilesByPubkey, id))
			.filter((item) => item !== undefined)
	);

	let canLoadOldTimeline = $derived(timelineItems.length < TIMELINE_LIMIT);

	let lastTimestamp = $derived(
		timelineItems.length > 0 ? timelineItems[timelineItems.length - 1].post.createdAt : now()
	);

	onMount(async () => {
		const client = await initNostr();
		subscribeEvents(client);
		subscribeProfiles(client);
		subscribeTimeline(client);
	});

	onDestroy(() => {
		unsubscribeTimeline();
		unsubscribeProfiles();
		unsubscribeEvents();
	});

	async function handleLoadMore() {
		const client = await initNostr();
		requestOldTimeline(client, lastTimestamp, LOAD_LIMIT);
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
