<script lang="ts">
	import type { NostrEvent, NostrProfile } from '$lib/types/nostr';
	import { neventEncode, npubEncode } from 'nostr-tools/nip19';
	import { formatContent } from '$lib/util';
	import { Repeat2 } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { nostrState } from './state.svelte';
	import { emitProfile } from './subscription';

	export let event: NostrEvent;
	export let profiles: Record<string, NostrProfile>;

	onMount(() => {
		if (event.kind === 6 && event.repost) {
			const pubkey = event.repost.pubkey;

			if (!(pubkey in nostrState.profiles)) {
				emitProfile({
					kinds: [0],
					authors: [pubkey],
					limit: 1
				});
			}
		}
	});

	// 整数で表現された日時を表示用に整形する
	function formatTime(ts: number) {
		return new Date(ts * 1000).toLocaleString();
	}

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
</script>

<div id={event.id} class="post border-thin border rounded-md p-2 mt-2">
	{#if event.kind === 6 && event.repost}
		<div class="repost border-thin border-b mb-2">
			<div class="repost-header mb-1 flex">
				<span class="grow-0 shrink mr-1"><Repeat2 /></span>
				<span
					class="repost-display-name font-bold grow-0 shrink basis-auto min-w-0 whitespace-nowrap overflow-hidden mr-1"
				>
					<a href="/{npubEncode(event.pubkey)}">
						{#if profiles[event.pubkey]?.display_name}
							{profiles[event.pubkey]?.display_name!}
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
		</div>

		<div class="post-header mb-1 flex">
			<span
				class="user-display-name font-bold grow-0 shrink basis-auto min-w-0 whitespace-nowrap overflow-hidden mr-1"
			>
				<a href="/{npubEncode(event.repost.pubkey)}">
					{#if profiles[event.repost.pubkey]?.display_name}
						{profiles[event.repost.pubkey]?.display_name!}
					{:else if profiles[event.repost.pubkey]?.name}
						{profiles[event.repost.pubkey]?.name!}
					{:else}
						{event.repost.pubkey.substring(0, 9)}
					{/if}
				</a>
			</span>

			<span class="user-name text-thin grow shrink min-w-0 whitespace-nowrap overflow-hidden mr-1">
				{#if profiles[event.repost.pubkey]?.display_name && profiles[event.repost.pubkey]?.name && profiles[event.repost.pubkey]?.display_name !== profiles[event.repost.pubkey]?.name}
					@{profiles[event.repost.pubkey]?.name!}
				{/if}
			</span>

			<span class="post-created-at text-thin grow-0 shrink-0 basis-auto"
				><a href="/{getEventCode(event.repost)}" class="underline"
					>{formatTime(event.repost.created_at)}</a
				></span
			>
		</div>

		{#if event.repost.reference}
			<div class="ref-link underline">
				<a href="/{getRefEventCode(event.repost)}">[参照]</a>
			</div>
		{/if}

		<div class="post-content wrap-break-word">
			{@html formatContent(event.repost.content)}
		</div>
	{:else}
		<div class="post-header mb-1 flex">
			<span
				class="user-display-name font-bold grow-0 shrink basis-auto min-w-0 whitespace-nowrap overflow-hidden mr-1"
			>
				<a href="/{npubEncode(event.pubkey)}">
					{#if profiles[event.pubkey]?.display_name}
						{profiles[event.pubkey]?.display_name!}
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
			<div class="ref-link underline">
				<a href="/{getRefEventCode(event)}">[参照]</a>
			</div>
		{/if}

		<div class="post-content wrap-break-word">
			{@html formatContent(event.content)}
		</div>
	{/if}
</div>
