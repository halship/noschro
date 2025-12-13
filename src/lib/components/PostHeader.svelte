<script lang="ts">
	import { neventEncode, npubEncode } from 'nostr-tools/nip19';
	import type { NostrEvent, NostrProfile } from '$lib/types/nostr';
	import { formatDisplayName } from '$lib/util';

	export let event: NostrEvent;
	export let profile: NostrProfile | undefined;

	function getEventCode(ev: NostrEvent): string {
		return neventEncode({
			id: ev.id,
			author: ev.pubkey
		});
	}

	function formatTime(ts: number) {
		return new Date(ts * 1000).toLocaleString();
	}
</script>

<div class="post-header mb-1 flex flex-nowrap w-full">
    <div class="overflow-hidden flex flex-nowrap grow shrink basis-0 min-w-0">
	<span
		class="user-display-name font-bold whitespace-nowrap mr-1 grow-0 basis-0 min-w-0 overflow-hidden"
	>
		<a href="/{npubEncode(event.pubkey)}">
			{#if profile?.display_name}
				{@html formatDisplayName(profile.display_name!, profile.tags)}
			{:else if profile?.name}
				{profile?.name!}
			{:else}
				{event.pubkey.substring(0, 9)}
			{/if}
		</a>
	</span>

	<span class="user-name text-thin grow shrink min-w-0 whitespace-nowrap overflow-hidden mr-1 flex-none">
		{#if profile?.display_name && profile?.name && profile?.display_name !== profile?.name}
			@{profile?.name!}
		{/if}
	</span>
	</div>

	<span class="post-created-at text-thin grow-0 shrink-0 basis-auto"
		><a href="/{getEventCode(event)}" class="underline">{formatTime(event.created_at)}</a></span
	>
</div>
