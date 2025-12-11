<script lang="ts">
	import Post from './Post.svelte';
	import type { NostrEvent, NostrProfile } from '$lib/types/nostr';

	export let events: NostrEvent[];
	export let eventsById: Record<string, NostrEvent>;
	export let profiles: Record<string, NostrProfile>;
</script>

<div id="notifications">
	{#each events as ev (ev.id)}
		<Post event={ev} {eventsById} {profiles} />
	{/each}
</div>
