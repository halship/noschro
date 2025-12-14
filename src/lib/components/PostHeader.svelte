<script lang="ts">
	import { neventEncode, npubEncode } from 'nostr-tools/nip19';
	import type { NostrEvent, NostrProfile } from '$lib/types/nostr';
	import { formatDisplayName } from '$lib/formatter';

	let { event, profile }: { event: NostrEvent; profile: NostrProfile | undefined } = $props();

	function getEventCode(ev: NostrEvent): string {
		return neventEncode({
			id: ev.id,
			author: ev.pubkey
		});
	}

	function formatTime(ts: number) {
		const datetime = new Date(ts * 1000);
		const now = new Date(Date.now());
		if (datetime.getDay() === now.getDay()) {
			const hour = datetime.getHours();
			const minutes = datetime.getMinutes();

			const minutesString = minutes > 9 ? minutes.toString() : `0${minutes}`;
			return `${hour}:${minutesString}`;
		}

		const month = datetime.getMonth() + 1;
		const day = datetime.getDate();

		const dayString = day > 9 ? day.toString() : `0${day}`;
		return `${month}/${dayString}`;
	}
</script>

<div class="post-header mb-1 flex justify-between">
	<div class="min-w-0 w-0 grow shrink text-nowrap overflow-hidden">
		<a href="/{npubEncode(event.pubkey)}">
			<span class="user-display-name font-bold mr-1">
				{#if profile?.display_name}
					{@html formatDisplayName(profile.display_name!, profile.tags)}
				{:else if profile?.name}
					{profile?.name!}
				{:else}
					{event.pubkey.substring(0, 9)}
				{/if}
			</span>

			{#if profile?.display_name && profile?.name && profile?.display_name !== profile?.name}
				<span class="user-name text-thin">
					@{profile?.name!}
				</span>
			{/if}
		</a>
	</div>

	<span class="post-created-at text-thin text-right text-nowrap pl-2"
		><a href="/{getEventCode(event)}" class="underline">{formatTime(event.created_at)}</a></span
	>
</div>
