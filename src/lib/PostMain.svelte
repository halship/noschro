<script lang="ts">
	import { neventEncode, npubEncode } from 'nostr-tools/nip19';
	import type { NostrEvent, NostrProfile } from './types/nostr';
	import { formatContent, formatDisplayName } from './util';

	export let event: NostrEvent;
	export let profiles: Record<string, NostrProfile>;

	function getEventCode(ev: NostrEvent): string {
		return neventEncode({
			id: ev.id,
			author: ev.pubkey
		});
	}

	function getRefEventCode(ev: NostrEvent): string {
		return neventEncode({
			id: ev.reference!.id,
			author: ev.reference!.pubkey
		});
	}

	// 整数で表現された日時を表示用に整形する
	function formatTime(ts: number) {
		return new Date(ts * 1000).toLocaleString();
	}
</script>

<div class="post-header mb-1 flex">
	<span
		class="user-display-name font-bold grow-0 shrink basis-auto min-w-0 whitespace-nowrap overflow-hidden mr-1"
	>
		<a href="/{npubEncode(event.pubkey)}">
			{#if profiles[event.pubkey]?.display_name}
				{formatDisplayName(profiles[event.pubkey]?.display_name!, profiles[event.pubkey]?.tags!)}
			{:else if profiles[event.pubkey]?.name}
				{profiles[event.pubkey]?.name!}
			{:else}
				{event.pubkey.substring(0, 9)}
			{/if}
		</a>
	</span>

	<span class="user-name text-thin grow shrink min-w-0 whitespace-nowrap overflow-hidden mr-1">
		{#if profiles[event.pubkey]?.display_name && profiles[event.pubkey]?.name && profiles[event.pubkey]?.display_name !== profiles[event.pubkey]?.name}
			@{profiles[event.pubkey]?.name!}
		{/if}
	</span>

	<span class="post-created-at text-thin grow-0 shrink-0 basis-auto"
		><a href="/{getEventCode(event)}" class="underline">{formatTime(event.created_at)}</a></span
	>
</div>

{#if event.reference}
	<div class="ref-link underline mb-1">
		<a href="/{getRefEventCode(event)}">[参照]</a>
	</div>
{/if}

<div class="post-content wrap-break-word leading-none">
	{@html formatContent(event.content, event.tags)}
</div>
