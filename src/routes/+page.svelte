<script lang="ts">
	import { initNostr } from '$lib/client';
	import PostItem from '$lib/components/PostItem.svelte';
	import { GLOBAL_RELAY } from '$lib/constants';
	import { toPost } from '$lib/models/post';
	import { appState } from '$lib/state.svelte';
	import { subscribeGlobalTimeline } from '$lib/timelines/global_timeline';
	import { onMount } from 'svelte';

	onMount(() => {
		initNostr([...GLOBAL_RELAY]);

		const unsubscribe = subscribeGlobalTimeline();

		return () => {
			unsubscribe();
		};
	});
</script>

{#each appState.timelineIds as id (id)}
	<PostItem post={toPost(appState.eventsById[id])} />
{/each}
