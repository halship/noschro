<script lang="ts">
	import LongForm from '$lib/components/LongForm.svelte';
	import Post from '$lib/components/Post.svelte';
	import Profile from '$lib/components/Profile.svelte';
	import { nostrState } from '$lib/state.svelte.js';
	import { emitEvent, emitNaddrEvent, emitProfile } from '$lib/subscription.js';
	import type { NostrEvent } from '$lib/types/nostr.js';
	import { tagFilter } from '$lib/util.js';
	import { onMount } from 'svelte';

	let { data, params } = $props();

	onMount(() => {
		if (data.result.type === 'nevent' && !(data.result.data.id in nostrState.eventsById)) {
			emitEvent([data.result.data.id]);
		} else if (data.result.type === 'note' && !(data.result.data in nostrState.eventsById)) {
			emitEvent([data.result.data]);
		} else if (data.result.type === 'npub' && !(data.result.data in nostrState.profiles)) {
			emitProfile([data.result.data]);
		} else if (data.result.type === 'naddr' && !(params.code in nostrState.eventsByAddr)) {
			emitNaddrEvent(data.result.data);
		}
	});

	function goBack(event: MouseEvent) {
		event.preventDefault();
		history.back();
	}

	function getNaddrEvent(): NostrEvent | null {
		if (data.result.type === 'naddr') {
			const { identifier, pubkey, kind } = data.result.data;

			for (const ev of nostrState.eventsByAddr) {
				const evIdentifiers = ev.tags.filter(tagFilter('d')).map((tag) => tag[1]);
				if (evIdentifiers.length === 0) continue;

				if (evIdentifiers[0] === identifier && ev.pubkey === pubkey && ev.kind === kind) {
					return ev;
				}
			}
		}
		return null;
	}
</script>

<div class="navigation">
	<a href="/" class="underline" onclick={goBack}>← Back</a>
</div>

{#if data.result.type === 'nevent' && data.result.data.id in nostrState.eventsById}
	<Post
		event={nostrState.eventsById[data.result.data.id]}
		eventsById={nostrState.eventsById}
		profiles={nostrState.profiles}
	/>
{:else if data.result.type === 'note' && data.result.data in nostrState.eventsById}
	<Post
		event={nostrState.eventsById[data.result.data]}
		eventsById={nostrState.eventsById}
		profiles={nostrState.profiles}
	/>
{:else if data.result.type === 'npub' && data.result.data in nostrState.profiles}
	<Profile profiles={nostrState.profiles} pubkey={data.result.data} />
{:else if data.result.type === 'naddr' && getNaddrEvent()}
	<LongForm event={getNaddrEvent()!} profiles={nostrState.profiles} />
{:else}
	<p class="text-center">loading...</p>
{/if}
