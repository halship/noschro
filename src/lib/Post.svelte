<script lang="ts">
	import type { NostrEvent, NostrProfile, NostrRef } from '$lib/types/nostr';
	import { neventEncode, npubEncode } from 'nostr-tools/nip19';
	import { formatContent } from '$lib/util';
	import { emitEvent, emitProfile } from './subscription';
	import { nostrState } from './state.svelte';

	export let nostr_event: NostrEvent;
	export let profiles: Record<string, NostrProfile>;
	export let nostr_refs: Record<string, NostrRef>;

	// 整数で表現された日時を表示用に整形する
	function formatTime(ts: number) {
		return new Date(ts * 1000).toLocaleString();
	}

	function getEventCode(): string {
		return neventEncode({
			id: nostr_event.id,
			author: nostr_event.pubkey
		});
	}

	function getRefEventCode(): string {
		const nostrRef = nostr_refs[nostr_event.id]!;

		return neventEncode({
			id: nostrRef.id,
			author: nostrRef.pubkey
		});
	}
</script>

<div id={nostr_event.id} class="post border-thin border rounded-md p-2 mt-2">
	<div class="post-header mb-1 flex">
		<span
			class="user-display-name font-bold grow-0 shrink basis-auto min-w-0 whitespace-nowrap overflow-hidden mr-1"
		>
			<a href="/{npubEncode(nostr_event.pubkey)}">
				{#if profiles[nostr_event.pubkey]?.display_name}
					{profiles[nostr_event.pubkey]?.display_name!}
				{:else if profiles[nostr_event.pubkey]?.name}
					{profiles[nostr_event.pubkey]?.name!}
				{:else}
					{nostr_event.pubkey.substring(0, 9)}
				{/if}
			</a>
		</span>

		<span class="user-name text-thin grow shrink min-w-0 whitespace-nowrap overflow-hidden mr-1">
			{#if profiles[nostr_event.pubkey]?.display_name && profiles[nostr_event.pubkey]?.name && profiles[nostr_event.pubkey]?.display_name !== profiles[nostr_event.pubkey]?.name}
				@{profiles[nostr_event.pubkey]?.name!}
			{/if}
		</span>

		<span class="post-created-at text-thin grow-0 shrink-0 basis-auto"
			><a href="/{getEventCode()}" class="underline">{formatTime(nostr_event.created_at)}</a></span
		>
	</div>

	{#if nostr_event.id in nostrState.nostrRefs}
		<div class="ref-link underline">
			<a href="/{getRefEventCode()}">[参照]</a>
		</div>
	{/if}

	<div class="post-content wrap-break-word">
		{@html formatContent(nostr_event.content)}
	</div>
</div>
