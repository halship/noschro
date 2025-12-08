<script lang="ts">
	import type { NostrEvent, NostrProfile } from '$lib/types/nostr';
	import { neventEncode, npubEncode } from 'nostr-tools/nip19';
	import { formatContent } from '$lib/util';
	import { emitEvent, emitProfile } from './subscription';
	import { nostrState } from './state.svelte';

	let { event_id } = $props();

	let nostrEvent: NostrEvent | undefined = $derived.by(() => {
		if (event_id in nostrState.eventsById) {
			return nostrState.eventsById[event_id];
		}

		emitEvent({
			kinds: [1],
			ids: [event_id],
			limit: 20
		});

		return undefined;
	});
	let pubkey: string | undefined = $derived(nostrEvent?.pubkey);
	let profile: NostrProfile | undefined = $derived.by(() => {
		if (pubkey) {
			if (pubkey in nostrState.profiles) {
				return nostrState.profiles[pubkey];
			}

			emitProfile({
				kinds: [0],
				authors: [pubkey],
				limit: 1
			});
		}
		return undefined;
	});

	// 整数で表現された日時を表示用に整形する
	function formatTime(ts: number) {
		return new Date(ts * 1000).toLocaleString();
	}

	function getEventCode(): string {
		return neventEncode({
			id: event_id,
			author: pubkey!
		});
	}

	function getRefEventCode(): string {
		const nostrRef = nostrState.nostrRefs[event_id]!;

		return neventEncode({
			id: nostrRef.id,
			author: nostrRef.pubkey
		});
	}
</script>

<div id={event_id} class="post border-thin border rounded-md p-2 mt-2">
	<div class="post-header mb-1 flex">
		<span
			class="user-display-name font-bold grow-0 shrink basis-auto min-w-0 whitespace-nowrap overflow-hidden mr-1"
		>
			{#if nostrEvent}
				<a href="/{npubEncode(pubkey!)}">
					{#if profile?.display_name}
						{profile?.display_name!}
					{:else if profile?.name}
						{profile?.name!}
					{:else}
						{pubkey?.substring(0, 9)}
					{/if}
				</a>
			{/if}
		</span>

		<span class="user-name text-thin grow shrink min-w-0 whitespace-nowrap overflow-hidden mr-1">
			{#if profile?.display_name && profile?.name && profile?.display_name !== profile?.name}
				@{profile?.name!}
			{/if}
		</span>

		{#if nostrEvent}
			<span class="post-created-at text-thin grow-0 shrink-0 basis-auto"
				><a href="/{getEventCode()}" class="underline">{formatTime(nostrEvent!.created_at)}</a
				></span
			>
		{/if}
	</div>

	{#if event_id in nostrState.nostrRefs}
		<div class="ref-link underline">
			<a href="/{getRefEventCode()}">[参照]</a>
		</div>
	{/if}

	<div class="post-content wrap-break-word">
		{@html formatContent(nostrEvent?.content ?? '')}
	</div>
</div>
