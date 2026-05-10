<script lang="ts">
	import PostView from '$lib/components/PostView.svelte';
	import { appState } from '$lib/state.svelte';
	import { onDestroy, onMount } from 'svelte';
	import type { PageProps } from './$types';
	import { initNostr } from '$lib/client';
	import { requestEvents, subscribeEvents, unsubscribeEvents } from '$lib/subscriptions/events';
	import { toPostItem, toTimelineItem, type PostItem } from '$lib/models/timeline';
	import { subscribeProfiles, unsubscribeProfiles } from '$lib/subscriptions/profiles';

	let { data }: PageProps = $props();

	let currentItem = $derived(
		toTimelineItem(appState.eventsById, appState.profilesByPubkey, data.id)
	);

	let replyItems: PostItem[] = $derived.by(() => {
		if (currentItem?.kind !== 'post') return [];

		let item: PostItem | undefined = currentItem as PostItem;
		if (!item?.replyToItem) return [];

		let result: PostItem[] = [];
		item = toPostItem(appState.eventsById, appState.profilesByPubkey, item?.replyToItem?.id);

		while (item) {
			result = [item, ...result];

			if (item.kind === 'post') {
				item = item.replyToItem
					? toPostItem(appState.eventsById, appState.profilesByPubkey, item.replyToItem.id)
					: undefined;
			} else {
				break;
			}
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

{#each replyItems as item (item.post.id)}
	<PostView
		post={item.post}
		profile={item.profile}
		replyToUsers={item.replyToUsers}
		quotes={item.quotes}
		contentUsers={item.contentUsers}
	/>
{/each}

{#if replyItems.length > 0}
	<div class="h-2 dark:bg-gray-700"></div>
{/if}

{#if currentItem && currentItem.kind === 'post'}
	<PostView
		post={currentItem.post}
		profile={currentItem.profile}
		replyToUsers={currentItem.replyToUsers}
		quotes={currentItem.quotes}
		contentUsers={currentItem.contentUsers}
	/>
{/if}
