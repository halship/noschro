<script lang="ts">
	import type { NostrEvent, NostrProfile } from '$lib/types/nostr';
	import { npubEncode } from 'nostr-tools/nip19';
	import { Repeat2 } from '@lucide/svelte';
	import { nostrState } from './state.svelte';
	import PostMain from './PostMain.svelte';
	import { formatDisplayName, formatReaction, getRefIds, getRefPubkeys } from './util';
	import { onMount } from 'svelte';
	import { emitEvent, emitProfile } from './subscription';

	export let event: NostrEvent;
	export let profiles: Record<string, NostrProfile>;

	onMount(() => {
		if (event.kind === 6 || event.kind === 16) {
			const ids = getRefIds(event);
			const pubkeys = getRefPubkeys(event);

			if (ids.length > 0) {
				emitEvent(ids);
			}
			if (pubkeys.length > 0) {
				emitProfile(pubkeys);
			}
		} else if (event.kind === 7) {
			const ids = getRefIds(event);
			const pubkeys = getRefPubkeys(event);

			if (ids.length > 0) {
				emitEvent(ids);
			}
			if (pubkeys.length > 0) {
				emitProfile(pubkeys);
			}
		}
	});
</script>

<div id={event.id} class="post border-thin border rounded-md p-2 mt-2">
	{#if event.kind === 6 || event.kind === 16}
		<div class="repost-header mb-2 pb-1 flex border-thin border-b">
			<span class="grow-0 shrink mr-1"><Repeat2 /></span>
			<span
				class="repost-display-name font-bold grow-0 shrink basis-auto min-w-0 whitespace-nowrap overflow-hidden mr-1"
			>
				<a href="/{npubEncode(event.pubkey)}">
					{#if profiles[event.pubkey]?.display_name}
						{@html formatDisplayName(
							profiles[event.pubkey].display_name!,
							profiles[event.pubkey].tags
						)}
					{:else if profiles[event.pubkey]?.name}
						{profiles[event.pubkey]?.name!}
					{:else}
						{event.pubkey.substring(0, 9)}
					{/if}
				</a>
			</span>

			<span
				class="repost-name text-thin grow shrink min-w-0 whitespace-nowrap overflow-hidden mr-1"
			>
				{#if profiles[event.pubkey]?.display_name && profiles[event.pubkey]?.name && profiles[event.pubkey]?.display_name !== profiles[event.pubkey]?.name}
					@{profiles[event.pubkey]?.name!}
				{/if}
			</span>
		</div>

		{#if getRefIds(event)[0] in nostrState.eventsById}
			<PostMain event={nostrState.eventsById[getRefIds(event)[0]]} {profiles} />
		{/if}
	{:else if event.kind === 7}
		<div class="reaction-header mb-2 pb-1 flex border-thin border-b">
			<span class="grow-0 shrink mr-1">{@html formatReaction(event.content, event.tags)}</span>
			<span
				class="reaction-display-name font-bold grow-0 shrink basis-auto min-w-0 whitespace-nowrap overflow-hidden mr-1"
			>
				<a href="/{npubEncode(event.pubkey)}">
					{#if profiles[event.pubkey]?.display_name}
						{@html formatDisplayName(
							profiles[event.pubkey].display_name!,
							profiles[event.pubkey].tags
						)}
					{:else if profiles[event.pubkey]?.name}
						{profiles[event.pubkey]?.name!}
					{:else}
						{event.pubkey.substring(0, 9)}
					{/if}
				</a>
			</span>

			<span
				class="reaction-name text-thin grow shrink min-w-0 whitespace-nowrap overflow-hidden mr-1"
			>
				{#if profiles[event.pubkey]?.display_name && profiles[event.pubkey]?.name && profiles[event.pubkey]?.display_name !== profiles[event.pubkey]?.name}
					@{profiles[event.pubkey]?.name!}
				{/if}
			</span>
		</div>

		{#if getRefIds(event)[0] in nostrState.eventsById}
			<PostMain event={nostrState.eventsById[getRefIds(event)[0]]} {profiles} />
		{/if}
	{:else}
		<PostMain {event} {profiles} />
	{/if}
</div>
