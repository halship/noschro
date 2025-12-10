<script lang="ts">
	import LongForm from '$lib/LongForm.svelte';
	import Post from '$lib/Post.svelte';
	import Profile from '$lib/Profile.svelte';
	import { nostrState } from '$lib/state.svelte.js';
	import { emitEvent, emitProfile } from '$lib/subscription.js';
	import { onMount } from 'svelte';

	let { data } = $props();

	onMount(() => {
		if (data.result.type === 'nevent' && !(data.result.data.id in nostrState.eventsById)) {
			emitEvent([data.result.data.id]);
		} else if (data.result.type === 'note' && !(data.result.data in nostrState.eventsById)) {
			emitEvent([data.result.data]);
		} else if (data.result.type === 'npub' && !(data.result.data in nostrState.profiles)) {
			emitProfile([data.result.data]);
		} else if (
			data.result.type === 'naddr' &&
			!(data.result.data.identifier in nostrState.eventsById)
		) {
			emitEvent([data.result.data.identifier]);
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
{:else if data.result.type === 'naddr' && data.result.data.identifier in nostrState.eventsById}
	<LongForm
		event={nostrState.eventsById[data.result.data.identifier]}
		profiles={nostrState.profiles}
	/>
{:else}
	<p class="text-center">loading...</p>
{/if}
