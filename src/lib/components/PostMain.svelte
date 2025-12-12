<script lang="ts">
	import { neventEncode, npubEncode } from 'nostr-tools/nip19';
	import type { NostrEvent, NostrProfile } from '$lib/types/nostr';
	import { formatContent, formatDisplayName, getRefIds, getRefPubkeys, getNaddr } from '$lib/util';
	import { onMount } from 'svelte';
	import PostHeader from './PostHeader.svelte';

	export let event: NostrEvent;
	export let profiles: Record<string, NostrProfile>;

	onMount(() => {
		/*
		const pubkeys = getRefPubkeys(event);
		if (pubkeys.length > 0) {
			emitProfile(pubkeys.filter((key) => !(key in profiles)));
		}
		*/
	});

	function getRefEventCode(ev: NostrEvent): string {
		return neventEncode({
			id: getRefIds(ev)[0],
			author: getRefPubkeys(ev)[0]
		});
	}

	function formatMention(profile: NostrProfile | undefined, pubkey: string): string {
		const npub = npubEncode(pubkey).slice(0, 9);
		let result = ['@'];

		if (profile) {
			if (profile.display_name) {
				result.push(formatDisplayName(profile.display_name, profile.tags));
			} else if (profile.name) {
				result.push(profile.name);
			} else {
				result.push(npub);
			}
		} else {
			result.push(npub);
		}

		return result.join('');
	}
</script>

<PostHeader {event} profile={profiles[event.pubkey]} />

{#if getRefIds(event).length > 0}
	<div class="ref-link underline mb-1">
		<a href="/{getRefEventCode(event)}">[返信元]</a>
	</div>
{/if}

{#if getRefPubkeys(event).length > 0}
	<div class="mentions mb-1">
		{#each getRefPubkeys(event) as pubkey}
			<a class="mr-2" href="/{npubEncode(pubkey)}"
				>{@html formatMention(profiles[pubkey], pubkey)}</a
			>
		{/each}
	</div>
{/if}

{#if event.kind === 1}
	<div class="post-content wrap-break-word leading-none mb-1">
		{@html formatContent(event.content, event.tags)}
	</div>
{:else if event.kind === 30023}
	<a href="/{getNaddr(event)}" class="underline">[長文投稿]</a>
{/if}
