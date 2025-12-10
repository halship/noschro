<script lang="ts">
	import type { NostrEvent, NostrProfile } from '$lib/types/nostr';
	import { npubEncode } from 'nostr-tools/nip19';
	import { Repeat2 } from '@lucide/svelte';
	import { nostrState } from './state.svelte';
	import PostMain from './PostMain.svelte';
	import { formatDisplayName, getRefIds } from './util';

	export let event: NostrEvent;
	export let profiles: Record<string, NostrProfile>;

	function getRepostEvent(ev: NostrEvent): NostrEvent | undefined {
		return nostrState.eventsById[getRefIds(ev)[0]];
	}
</script>

<div id={event.id} class="post border-thin border rounded-md p-2 mt-2">
	{#if (event.kind === 6 || event.kind === 16) && getRefIds(event).length > 0}
		<div class="repost border-thin border-b mb-2">
			<div class="repost-header mb-1 flex">
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
		</div>

		{#if getRefIds(event)[0] in nostrState.eventsById}
			<PostMain event={getRepostEvent(event)!} {profiles} />
		{/if}
	{:else}
		<PostMain {event} {profiles} />
	{/if}
</div>
