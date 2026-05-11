<script lang="ts">
	import PostView from '$lib/components/PostView.svelte';
	import { appState } from '$lib/state.svelte';
	import type { PageProps } from './$types';
	import { requestEvents } from '$lib/subscriptions/events';
	import { toPostItem, toTimelineItem, type PostItem } from '$lib/models/timeline';
	import { useNostrSubscriptions } from '$lib/subscriptions/lifecycle';

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

	useNostrSubscriptions(['events', 'profiles'], {
		onReady: () => {
			if (!(data.id in appState.eventsById)) {
				requestEvents([data.id]);
			}
		}
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
