<script lang="ts">
	import { neventEncode, npubEncode } from 'nostr-tools/nip19';
	import type { NostrEvent, NostrProfile } from './types/nostr';
	import { formatContent, formatDisplayName, getRefIds, getRefPubkeys } from './util';
	import { onMount } from 'svelte';
	import { nostrState } from './state.svelte';
	import { emitProfile } from './subscription';

	export let event: NostrEvent;
	export let profiles: Record<string, NostrProfile>;

	onMount(() => {
		if (!(event.pubkey in nostrState.profiles)) {
			emitProfile([event.pubkey]);
		}

		if (event.mentions) {
			const pubkeys = event.mentions.filter((m) => !(m in nostrState));
			emitProfile(pubkeys);
		}
	});

	function getEventCode(ev: NostrEvent): string {
		return neventEncode({
			id: ev.id,
			author: ev.pubkey
		});
	}

	function getRefEventCode(ev: NostrEvent): string {
		return neventEncode({
			id: getRefIds(ev)[0],
			author: getRefPubkeys(ev)[0]
		});
	}

	// 整数で表現された日時を表示用に整形する
	function formatTime(ts: number) {
		return new Date(ts * 1000).toLocaleString();
	}

	function formatMention(pubkey: string): string {
		const npub = npubEncode(pubkey).slice(0, 9);
		let result = ['@'];

		if (pubkey in profiles) {
			if (profiles[pubkey].display_name) {
				result.push(formatDisplayName(profiles[pubkey].display_name, profiles[pubkey].tags));
			} else if (profiles[pubkey].name) {
				result.push(profiles[pubkey].name);
			} else {
				result.push(npub);
			}
		} else {
			result.push(npub);
		}

		return result.join('');
	}
</script>

<div class="post-header mb-1 flex">
	<span
		class="user-display-name font-bold grow-0 shrink basis-auto min-w-0 whitespace-nowrap overflow-hidden mr-1"
	>
		<a href="/{npubEncode(event.pubkey)}">
			{#if profiles[event.pubkey]?.display_name}
				{@html formatDisplayName(profiles[event.pubkey].display_name!, profiles[event.pubkey].tags)}
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

{#if getRefIds(event).length > 0}
	<div class="ref-link underline mb-1">
		<a href="/{getRefEventCode(event)}">[返信元]</a>
	</div>
{/if}

{#if getRefPubkeys(event).length > 0}
	<div class="mentions mb-1">
		{#each getRefPubkeys(event) as pubkey}
			<a class="mr-2" href="/{npubEncode(pubkey)}">{@html formatMention(pubkey)}</a>
		{/each}
	</div>
{/if}

<div class="post-content wrap-break-word leading-none">
	{@html formatContent(event.content, event.tags)}
</div>
