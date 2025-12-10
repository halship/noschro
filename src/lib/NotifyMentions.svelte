<script lang="ts">
	import Post from './Post.svelte';
	import type { NostrEvent, NostrProfile } from './types/nostr';

	export let mentions: NostrEvent[];
	export let profiles: Record<string, NostrProfile>;
</script>

<div id="mentions">
	{#each mentions as ev (ev.id)}
		<Post event={ev} {profiles} />
	{/each}
</div>
