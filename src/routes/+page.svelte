<script lang="ts">
	import { initNostr } from '$lib/client';
	import Timeline from '$lib/components/Timeline.svelte';
	import { GLOBAL_RELAY } from '$lib/constants';
	import { toPost } from '$lib/models/post';
	import type { TimelineItem } from '$lib/models/timeline';
	import { appState } from '$lib/state.svelte';
	import { subscribeGlobalTimeline } from '$lib/subscriptions/global_timeline';
	import { subscribeProfiles } from '$lib/subscriptions/profiles';
	import { onMount } from 'svelte';

	let timelineItems = $derived(
		appState.timelineIds
			.map((id) => {
				if (!(id in appState.eventsById)) return null;

				const post = toPost(appState.eventsById[id]);
				const profile = appState.profilesByPubkey[post.pubkey];

				return { post, profile } as TimelineItem;
			})
			.filter((item) => item !== null)
	);

	onMount(() => {
		initNostr([...GLOBAL_RELAY]);

		const unsubscribeTimeline = subscribeGlobalTimeline();
		const unsubscribeProfiles = subscribeProfiles();

		return () => {
			unsubscribeTimeline();
			unsubscribeProfiles();
		};
	});
</script>

<svelte:head>
	<title>noschro - タイムライン</title>
</svelte:head>

<Timeline items={timelineItems} />
