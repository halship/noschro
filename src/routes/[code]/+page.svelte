<script lang="ts">
	import { goto } from '$app/navigation';
	import LongForm from '$lib/components/LongForm.svelte';
	import Post from '$lib/components/Post.svelte';
	import Profile from '$lib/components/Profile.svelte';
	import { kindMetaData, kindsEvent } from '$lib/consts.js';
	import { tryLogin } from '$lib/signer.js';
	import { nostrState } from '$lib/state.svelte.js';
	import { rxReqEvent, rxReqProfiles, subscribe } from '$lib/timelines/base_timeline.js';
	import { onMount } from 'svelte';

	let { data } = $props();

	onMount(async () => {
		if (!(await tryLogin())) {
			goto('/login');
			return;
		}

		await subscribe();

		if (
			(data.codeType === 'nevent' || data.codeType === 'note') &&
			!(data.id in nostrState.eventsById)
		) {
			rxReqEvent.emit({
				kinds: kindsEvent,
				ids: [data.id],
				limit: 1
			});
		} else if (
			(data.codeType === 'npub' || data.codeType === 'nprofile') &&
			!(data.pubkey in nostrState.profiles)
		) {
			rxReqProfiles.emit({
				kinds: [kindMetaData],
				authors: [data.pubkey],
				limit: 1
			});
		} else if (data.codeType === 'naddr' && !(data.addr in nostrState.eventsByAddr)) {
			rxReqEvent.emit({
				kinds: [data.kind],
				'#d': [data.identifier],
				authors: [data.pubkey],
				limit: 1
			});
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

{#if (data.codeType === 'nevent' || data.codeType === 'note') && data.id in nostrState.eventsById}
	<Post state={nostrState} event={nostrState.eventsById[data.id]} />
{:else if data.codeType === 'npub' && data.pubkey in nostrState.profiles}
	<Profile state={nostrState} profile={nostrState.profiles[data.pubkey]} />
{:else if data.codeType === 'naddr' && data.addr in nostrState.eventsByAddr}
	<LongForm state={nostrState} event={nostrState.eventsByAddr[data.addr]} />
{:else}
	<p class="text-center">loading...</p>
{/if}
