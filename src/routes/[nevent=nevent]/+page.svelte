<script lang="ts">
	import PostItem from '$lib/components/PostItem.svelte';
	import { appState } from '$lib/state.svelte';
	import { onMount } from 'svelte';
	import type { PageProps } from './$types';
	import { initNostr } from '$lib/client';
	import { requestEvents, subscribeEvents } from '$lib/subscriptions/events';
	import { toTimelineItem, type TimelineItem } from '$lib/models/timeline';
	import { subscribeProfiles } from '$lib/subscriptions/profiles';

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

	onMount(() => {
		const rxNostr = initNostr();
		const unsubscribeEvents = subscribeEvents(rxNostr);
		const unsubscribeProfiles = subscribeProfiles(rxNostr);

		if (!(data.id in appState.eventsById)) {
			requestEvents([data.id]);
		}

		return () => {
			unsubscribeEvents();
			unsubscribeProfiles();
		};
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
