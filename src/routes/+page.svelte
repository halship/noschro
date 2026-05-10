<script lang="ts">
	import { initNostr } from '$lib/client';
	import PostView from '$lib/components/PostView.svelte';
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
	import RepostPreview from '$lib/components/RepostPreview.svelte';

	let timelineItems = $derived(
		appState.timelineIds
			.map((id) => toTimelineItem(appState.eventsById, appState.profilesByPubkey, id))
			.filter((item) => item !== undefined)
	);

	let canLoadOldTimeline = $derived(timelineItems.length < TIMELINE_LIMIT);

	let lastTimestamp = $derived(
		timelineItems.length > 0 ? timelineItems[timelineItems.length - 1].createdAt : now()
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
	{#if item.kind === 'post'}
		{#if item.replyToItem?.item}
			<ReplyPreview post={item.replyToItem.item.post} />
		{/if}

		<PostView
			post={item.post}
			profile={item.profile}
			replyToUsers={item.replyToUsers}
			quotes={item.quotes}
			contentUsers={item.contentUsers}
		/>
	{:else if item.kind === 'repost'}
		<RepostPreview pubkey={item.pubkey} profile={item.profile} />

		{#if item.repostTo.item}
			<PostView
				post={item.repostTo.item.post}
				profile={item.repostTo.item.profile}
				replyToUsers={item.repostTo.item.replyToUsers}
				quotes={item.repostTo.item.quotes}
				contentUsers={item.repostTo.item.contentUsers}
			/>
		{:else}
			<div class="flex border-b border-gray-400 p-2 dark:border-gray-700">取得中</div>
		{/if}
	{/if}
{/each}

{#if canLoadOldTimeline}
	<button class="w-full bg-gray-300 p-2 text-center dark:bg-gray-800" onclick={handleLoadMore}
		>▼さらに読み込む▼</button
	>
{/if}
