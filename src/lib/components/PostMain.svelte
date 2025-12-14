<script lang="ts">
	import { neventEncode, npubEncode } from 'nostr-tools/nip19';
	import type { NostrEvent, NostrProfile } from '$lib/types/nostr';
	import { formatDisplayName } from '$lib/util';
	import PostHeader from './PostHeader.svelte';
	import PostUserImage from './PostUserImage.svelte';
	import PostContent from './PostContent.svelte';
	import { Repeat2 } from '@lucide/svelte';
	import { rxNostr } from '$lib/timelines/base_timeline';
	import { kindRepost } from '$lib/consts';

	let {
		event,
		eventsById,
		profiles,
		repostsById
	}: {
		event: NostrEvent;
		eventsById: Record<string, NostrEvent>;
		profiles: Record<string, NostrProfile>;
		repostsById: Record<string, string>;
	} = $props();

	let refIds: string[] = $derived(event.tags.filter((t) => t[0] === 'e').map((t) => t[1]));
	let refPubkeys: string[] = $derived(event.tags.filter((t) => t[0] === 'p').map((t) => t[1]));
	let naddr: string | undefined = $derived(
		event.tags
			.filter((t) => t[0] === 'd')
			.map((t) => t[1])
			.at(0)
	);

	let repostColor: string = $derived.by(() => {
		if (event.id in repostsById) {
			return 'text-repost';
		} else {
			return 'text-thin';
		}
	});

	function getRefEventCode(ev: NostrEvent): string {
		return neventEncode({
			id: refIds.slice(-1)[0],
			author: refPubkeys.slice(-1)[0]
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

	function handleRepost() {
		rxNostr
			?.send({
				kind: kindRepost,
				content: JSON.stringify(event),
				tags: [
					['e', event.id],
					['p', event.pubkey]
				]
			})
			.subscribe((packet) => {
				if (packet.ok) {
					repostsById = { ...repostsById, [event.id]: packet.eventId };
					console.log('Success to reposted');
				}
			});
	}
</script>

<div class="post-main grid grid-cols-[auto_1fr] grid-rows-[auto_1fr_auto]">
	<PostUserImage pubkey={event.pubkey} {profiles} />

	<PostHeader {event} profile={profiles[event.pubkey]} />

	<div class="break-all wrap-anywhere">
		{#if refIds.length > 0}
			<div class="ref-link underline mb-1">
				<a href="/{getRefEventCode(event)}">[返信元]</a>
			</div>
		{/if}

		{#if refPubkeys.length > 0}
			<div class="mentions mb-1 text-sm text-thin">
				{#each refPubkeys as pubkey}
					<a class="mr-2" href="/{npubEncode(pubkey)}"
						>{@html formatMention(profiles[pubkey], pubkey)}</a
					>
				{/each}
			</div>
		{/if}

		{#if event.kind === 1}
			<PostContent
				content={event.content}
				tags={event.tags}
				{profiles}
				{eventsById}
				{repostsById}
			/>
		{:else if event.kind === 30023 && naddr}
			<a href="/{naddr}" class="underline">[長文投稿]</a>
		{/if}
	</div>

	<div class="flex mt-3">
		<button class={repostColor} onclick={handleRepost}><Repeat2 /></button>
	</div>
</div>
