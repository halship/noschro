<script lang="ts">
	import Post from '$lib/Post.svelte';
	import Profile from '$lib/Profile.svelte';
	import { nostrState } from '$lib/state.svelte.js';
	import { emitEvent, emitProfile } from '$lib/subscription.js';
	import type { NostrEvent, NostrProfile } from '$lib/types/nostr.js';

	let { data } = $props();

	let event: NostrEvent | undefined = $derived.by(() => {
		if (data.result.type === 'nevent') {
			if (data.result.data.id in nostrState.eventsById) {
				return nostrState.eventsById[data.result.data.id];
			} else {
				emitEvent({
					kinds: [1],
					ids: [data.result.data.id],
					limit: 1
				});
			}
		} else if (data.result.type === 'note') {
			if (data.result.data in nostrState.eventsById) {
				return nostrState.eventsById[data.result.data];
			} else {
				emitEvent({
					kinds: [1],
					ids: [data.result.data],
					limit: 1
				});
			}
		}

		return undefined;
	});

	let profile: NostrProfile | undefined = $derived.by(() => {
		if (data.result.type === 'npub') {
			if (data.result.data in nostrState.profiles) {
				return nostrState.profiles[data.result.data];
			} else {
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

{#if (data.result.type === 'nevent' || data.result.type === 'note') && event}
	<Post {event} profiles={nostrState.profiles} />
{:else if data.result.type === 'npub' && profile}
	<Profile {profile} />
{/if}
