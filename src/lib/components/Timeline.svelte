<script lang="ts">
	import type { TimelineItem } from '$lib/models/timeline';
	import PostItem from './PostItem.svelte';

	type Props = {
		items: TimelineItem[];
	};

	let { items }: Props = $props();
</script>

{#each items as item (item.post.id)}
	<PostItem post={item.post} profile={item.profile} />
{/each}
