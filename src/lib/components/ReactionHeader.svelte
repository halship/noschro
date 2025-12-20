<script lang="ts">
	import { Repeat2 } from '@lucide/svelte';
	import type { NostrEvent, NostrProfile } from '$lib/types/nostr';
	import { npubEncode } from 'nostr-tools/nip19';
	import { kindGeneralRepost, kindReaction, kindRepost } from '$lib/consts';
	import FormatedText from './FormatedText.svelte';
	import { getEmojis } from '$lib/util';

	let {
		event,
		profile
	}: {
		event: NostrEvent;
		profile: NostrProfile | undefined;
	} = $props();

	let emojis = $derived(getEmojis(profile?.tags ?? []));
</script>

<div class="reaction-header mb-2 pb-1 flex border-thin border-b">
	<span
		class="grow-0 shrink mr-1"
		class:text-repost={event.kind === kindRepost || event.kind === kindGeneralRepost}
	>
		{#if event.kind === kindRepost || event.kind === kindGeneralRepost}
			<Repeat2 />
		{:else if event.kind === kindReaction}
			<FormatedText text={event.content} emojis={getEmojis(event.tags)} />
		{/if}
	</span>
	<a href="/{npubEncode(event.pubkey)}">
		<span
			class="reaction-display-name font-bold grow-0 shrink basis-auto min-w-0 whitespace-nowrap overflow-hidden mr-1"
		>
			{#if profile}
				{#if profile.display_name}
					<FormatedText text={profile.display_name} {emojis} />
				{:else if profile.name}
					{profile.name}
				{:else}
					{event.pubkey.substring(0, 9)}
				{/if}
			{/if}
		</span>

		<span
			class="reaction-name text-thin grow shrink min-w-0 whitespace-nowrap overflow-hidden mr-1"
		>
			{#if profile && profile.display_name && profile.name && profile.display_name !== profile.name}
				@{profile.name}
			{/if}
		</span>
	</a>
</div>
