<script lang="ts">
	import PostItem from '$lib/components/PostItem.svelte';
	import { appState } from '$lib/state.svelte';
	import { onMount } from 'svelte';
	import type { PageProps } from './$types';
	import { initNostr } from '$lib/client';
	import { GLOBAL_RELAY } from '$lib/constants';
	import { requestEvents, subscribeEvents } from '$lib/subscriptions/events';
	import { toTimelineItem, type TimelineItem } from '$lib/models/timeline';
	import { subscribeProfiles } from '$lib/subscriptions/profiles';

	let { data }: PageProps = $props();

	let currentItem = $derived(
		toTimelineItem(appState.eventsById, appState.profilesByPubkey, data.id)
	);

	let replyItems: TimelineItem[] = $derived.by(() => {
		if (!currentItem?.replyTo) return [];

		let result: TimelineItem[] = [];
		let item = toTimelineItem(
			appState.eventsById,
			appState.profilesByPubkey,
			currentItem?.replyTo?.id
		);

		while (item) {
			result = [item, ...result];
			item = item.replyTo
				? toTimelineItem(appState.eventsById, appState.profilesByPubkey, item.replyTo.id)
				: undefined;
		}

		return result;
	});

	onMount(() => {
		initNostr([...GLOBAL_RELAY]);
		const unsubscribeEvents = subscribeEvents();
		const unsubscribeProfiles = subscribeProfiles();

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

{#if currentItem?.replyTo}
	{#each replyItems as item (item.post.id)}
		<PostItem post={item.post} profile={item.profile} />
	{/each}
{/if}

{#if currentItem}
	<PostItem post={currentItem.post} profile={currentItem.profile} />
{/if}
