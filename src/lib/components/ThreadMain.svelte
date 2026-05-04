<script lang="ts">
	import type { TimelineItem } from '$lib/models/timeline';
	import PostItem from './PostItem.svelte';

	type Props = {
		timelineItems: TimelineItem[];
	};

	let { timelineItems }: Props = $props();
</script>

{#each timelineItems as item (item.post.id)}
	<PostItem post={item.post} profile={item.profile} />
{/each}
