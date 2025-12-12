<script lang="ts">
	import { goto } from '$app/navigation';
	import LongForm from '$lib/components/LongForm.svelte';
	import Post from '$lib/components/Post.svelte';
	import Profile from '$lib/components/Profile.svelte';
	import { kindMetaData, kindPost, kindsEvent } from '$lib/consts.js';
	import { tryLogin } from '$lib/signer.js';
	import { nostrState } from '$lib/state.svelte.js';
	import { rxReqEvent, rxReqProfiles, subscribe } from '$lib/timelines/base_timeline.js';
	import type { NostrEvent } from '$lib/types/nostr.js';
	import { tagFilter } from '$lib/util.js';
	import { onMount } from 'svelte';

	let { data, params } = $props();

	onMount(async () => {
		if (!(await tryLogin())) {
			goto('/login');
			return;
		}

		await subscribe();

		if (data.result.type === 'nevent' && !(data.result.data.id in nostrState.eventsById)) {
			rxReqEvent.emit({
				kinds: data.result.data.kind ? [data.result.data.kind] : kindsEvent,
				ids: [data.result.data.id],
				limit: 1
			});
		} else if (data.result.type === 'note' && !(data.result.data in nostrState.eventsById)) {
			rxReqEvent.emit({
				kinds: kindsEvent,
				ids: [data.result.data],
				limit: 1
			});
		} else if (data.result.type === 'npub' && !(data.result.data in nostrState.profiles)) {
			rxReqProfiles.emit({
				kinds: [kindMetaData],
				authors: [data.result.data],
				limit: 1
			});
		} else if (data.result.type === 'naddr') {
			const key = `${data.result.data.kind}:${data.result.data.pubkey}:${data.result.data.identifier}`;
			if (!(key in nostrState.eventsByAddr)) {
				rxReqEvent.emit({
					kinds: [data.result.data.kind],
					'#d': [data.result.data.identifier],
					authors: [data.result.data.pubkey],
					limit: 1
				});
			}
		}
	});

	function goBack(event: MouseEvent) {
		event.preventDefault();
		history.back();
	}

	function getNaddrEvent(): NostrEvent | null {
		if (data.result.type === 'naddr') {
			const { identifier, pubkey, kind } = data.result.data;

			for (const ev of Object.values(nostrState.eventsById)) {
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
