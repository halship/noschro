<script lang="ts">
	import Post from '$lib/Post.svelte';
	import Profile from '$lib/Profile.svelte';
	import { emitProfile, emitEvent } from '$lib/subscription.js';
	import { get } from 'svelte/store';
	import type { NostrEvent, NostrProfile } from '$lib/types/nostr.js';
	import { nostrState } from '$lib/state.svelte.js';

	let { data } = $props();

	let kind: string = $derived(data.result.type);

	let eventId: string | undefined = $derived.by(() => {
		if (data.result.type === 'nevent') {
			return data.result.data.id;
		} else if (data.result.type === 'note') {
			return data.result.data;
		}

		return undefined;
	});

	let pubkey: string | undefined = $derived.by(() => {
		if (data.result.type === 'npub') {
			return data.result.data;
		}
		return undefined;
	});

	function goBack(event: MouseEvent) {
		event.preventDefault();
		history.back();
	}
</script>

<div class="navigation">
	<a href="/" class="underline" onclick={goBack}>← Back</a>
</div>

{#if kind === 'nevent' && eventId}
	<Post event_id={eventId} />
{:else if kind === 'note' && eventId}
	<Post event_id={eventId} />
{:else if kind === 'npub' && pubkey}
	<Profile {pubkey} />
{/if}
