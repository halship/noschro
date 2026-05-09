<script lang="ts">
	import PostItem from '$lib/components/PostItem.svelte';
	import { appState } from '$lib/state.svelte';
	import { onDestroy, onMount } from 'svelte';
	import type { PageProps } from './$types';
	import { initNostr } from '$lib/client';
	import { requestEvents, subscribeEvents, unsubscribeEvents } from '$lib/subscriptions/events';
	import { toTimelineItem, type TimelineItem } from '$lib/models/timeline';
	import { subscribeProfiles, unsubscribeProfiles } from '$lib/subscriptions/profiles';

	let { data }: PageProps = $props();

	let currentItem = $derived(
		toTimelineItem(appState.eventsById, appState.profilesByPubkey, data.id)
	);

	let replyItems: TimelineItem[] = $derived.by(() => {
		if (!currentItem?.replyToEvent) return [];

		let result: TimelineItem[] = [];
		let item = toTimelineItem(
			appState.eventsById,
			appState.profilesByPubkey,
			currentItem?.replyToEvent?.id
		);

		while (item) {
			result = [item, ...result];
			item = item.replyToEvent
				? toTimelineItem(appState.eventsById, appState.profilesByPubkey, item.replyToEvent.id)
				: undefined;
		}

		return result;
	});

	onMount(async () => {
		const client = await initNostr();
		subscribeEvents(client);
		subscribeProfiles(client);

		if (!(data.id in appState.eventsById)) {
			requestEvents([data.id]);
		}
	});

	onDestroy(() => {
		unsubscribeEvents();
		unsubscribeProfiles();
	});
</script>

<svelte:head>
	<title>noschro - 投稿</title>
</svelte:head>

{#if currentItem?.replyToEvent}
	{#each replyItems as item (item.post.id)}
		<PostItem
			post={item.post}
			profile={item.profile}
			replyToUsers={item.replyToUsers}
			quotes={item.quotes}
			contentUsers={item.contentUsers}
		/>
	{/each}

	<div class="h-2 dark:bg-gray-700"></div>
{/if}

{#if currentItem}
	<PostItem
		post={currentItem.post}
		profile={currentItem.profile}
		replyToUsers={currentItem.replyToUsers}
		quotes={currentItem.quotes}
		contentUsers={currentItem.contentUsers}
	/>
{/if}
