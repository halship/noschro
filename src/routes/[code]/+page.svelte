<script lang="ts">
	import Post from '$lib/Post.svelte';
	import Profile from '$lib/Profile.svelte';
	import { nostrState } from '$lib/state.svelte.js';
	import { emitEvent, emitProfile } from '$lib/subscription.js';
	import { onMount } from 'svelte';

	let { data } = $props();

	onMount(() => {
		if (data.result.type === 'nevent') {
			if (!(data.result.data.id in nostrState.eventsById)) {
				emitEvent({
					kinds: [1],
					ids: [data.result.data.id],
					limit: 1
				});
			}
		} else if (data.result.type === 'note') {
			if (!(data.result.data in nostrState.eventsById)) {
				emitEvent({
					kinds: [1],
					ids: [data.result.data],
					limit: 1
				});
			}
		} else if (data.result.type === 'npub') {
			if (!(data.result.data in nostrState.profiles)) {
				emitProfile({
					kinds: [0],
					authors: [data.result.data],
					limit: 1
				});
			}
		}
	});

	function goBack(event: MouseEvent) {
		event.preventDefault();
		history.back();
	}
</script>

<div class="navigation">
	<a href="/" class="underline" onclick={goBack}>← Back</a>
</div>

{#if data.result.type === 'nevent' && data.result.data.id in nostrState.eventsById}
	<Post
		nostr_event={nostrState.eventsById[data.result.data.id]}
		profiles={nostrState.profiles}
		nostr_refs={nostrState.nostrRefs}
	/>
{:else if data.result.type === 'note' && data.result.data in nostrState.eventsById}
	<Post
		nostr_event={nostrState.eventsById[data.result.data]}
		profiles={nostrState.profiles}
		nostr_refs={nostrState.nostrRefs}
	/>
{:else if data.result.type === 'npub' && data.result.data in nostrState.profiles}
	<Profile profile={nostrState.profiles[data.result.data]} />
{/if}
