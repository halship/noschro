<script lang="ts">
	import { Repeat2 } from '@lucide/svelte';
	import type { NostrEvent, NostrProfile } from '$lib/types/nostr';
	import { formatDisplayName, formatReaction } from '$lib/util';
	import { npubEncode } from 'nostr-tools/nip19';
	import { kindGeneralRepost, kindReaction, kindRepost } from '$lib/consts';

	export let event: NostrEvent;
	export let profile: NostrProfile | undefined;
</script>

<div class="reaction-header mb-2 pb-1 flex border-thin border-b">
	<span
		class="grow-0 shrink mr-1"
		class:text-repost={event.kind === kindRepost || event.kind === kindGeneralRepost}
	>
		{#if event.kind === kindRepost || event.kind === kindGeneralRepost}
			<Repeat2 />
		{:else if event.kind === kindReaction}
			{@html formatReaction(event.content, event.tags)}
		{/if}
	</span>
	<span
		class="reaction-display-name font-bold grow-0 shrink basis-auto min-w-0 whitespace-nowrap overflow-hidden mr-1"
	>
		<a href="/{npubEncode(event.pubkey)}">
			{#if profile?.display_name}
				{@html formatDisplayName(profile?.display_name!, profile?.tags)}
			{:else if profile?.name}
				{profile?.name!}
			{:else}
				{event.pubkey.substring(0, 9)}
			{/if}
		</a>
	</span>

	<span class="reaction-name text-thin grow shrink min-w-0 whitespace-nowrap overflow-hidden mr-1">
		{#if profile?.display_name && profile?.name && profile?.display_name !== profile?.name}
			@{profile?.name!}
		{/if}
	</span>
</div>
