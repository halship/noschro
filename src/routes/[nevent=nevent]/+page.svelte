<script lang="ts">
	import PostItem from '$lib/components/PostItem.svelte';
	import { toPost } from '$lib/models/post';
	import { appState } from '$lib/state.svelte';
	import { onMount } from 'svelte';
	import type { PageProps } from './$types';
	import { initNostr } from '$lib/client';
	import { GLOBAL_RELAY } from '$lib/constants';
	import { requestEvents, subscribeEvents } from '$lib/subscriptions/events';
	import type { TimelineItem } from '$lib/models/timeline';
	import { subscribeProfiles } from '$lib/subscriptions/profiles';

	let { data }: PageProps = $props();

	let currentItem: TimelineItem | undefined = $derived.by(() => {
		if (data.id in appState.eventsById) {
			let post = toPost(appState.eventsById[data.id]);
			let profile = appState.profilesByPubkey[post.pubkey];
			return {
				post,
				profile
			};
		} else {
			return undefined;
		}
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

{#if currentItem}
	<PostItem post={currentItem.post} profile={currentItem.profile} />
{/if}
