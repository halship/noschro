<script lang="ts">
	import Post from './Post.svelte';
	import type { NostrEvent, NostrProfile } from '$lib/types/nostr';

	let {
		events,
		eventsById,
		profiles,
		repostsById
	}: {
		events: NostrEvent[];
		eventsById: Record<string, NostrEvent>;
		profiles: Record<string, NostrProfile>;
		repostsById: Record<string, string>;
	} = $props();
</script>

<div id="notifications">
	{#each events as ev (ev.id)}
		<Post event={ev} {eventsById} {profiles} {repostsById} />
	{/each}
</div>
