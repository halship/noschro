<script lang="ts">
	import { naddrEncode, neventEncode, npubEncode } from 'nostr-tools/nip19';
	import type { NostrEvent, NostrProfile } from '$lib/types/nostr';
	import { formatDisplayName } from '$lib/formatter';
	import PostHeader from './PostHeader.svelte';
	import PostUserImage from './PostUserImage.svelte';
	import PostContent from './PostContent.svelte';
	import { Heart, Repeat2 } from '@lucide/svelte';
	import { rxNostr } from '$lib/timelines/base_timeline';
	import { kindReaction, kindRepost } from '$lib/consts';
	import { getAddr, getRefIds, getRefPubkeys } from '$lib/util';
	import { nostrState } from '$lib/state.svelte';
	import { pubkey } from '$lib/signer';

	let { event }: { event: NostrEvent } = $props();

	let refIds: string[] = $derived(event.tags.filter((t) => t[0] === 'e').map((t) => t[1]));
	let refPubkeys: string[] = $derived.by(() => {
		const result = event.tags.filter((t) => t[0] === 'p').map((t) => t[1]);
		return [...new Set(result)];
	});
	let naddr: string | null = $derived.by(() => {
		const identifier = event.tags
			.filter((t) => t[0] === 'd')
			.map((t) => t[1])
			.at(0);

		if (identifier) {
			return naddrEncode({
				kind: event.kind,
				pubkey: event.pubkey,
				identifier: identifier
			});
		} else {
			return null;
		}
	});

	let repostColor: string = $derived.by(() => {
		if (
			event.id in nostrState.eventsById &&
			nostrState.eventsById[event.id].kind === kindRepost &&
			nostrState.eventsById[event.id].pubkey === pubkey!
		) {
			return 'text-repost';
		} else {
			return 'text-thin';
		}
	});

	let reactionColor: string = $derived.by(() => {
		if (
			event.id in nostrState.eventsById &&
			nostrState.eventsById[event.id].kind === kindReaction &&
			nostrState.eventsById[event.id].pubkey === pubkey!
		) {
			return 'text-reaction';
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
		rxNostr?.send({
			kind: kindRepost,
			content: JSON.stringify(event),
			tags: [
				['e', event.id, nostrState.relays[0].url],
				['p', event.pubkey]
			]
		});
	}

	function handleReaction() {
		const idTags = getRefIds(event.tags).map((id) => ['e', id]);
		const pubkeyTags = getRefPubkeys(event.tags).map((pub) => ['p', pub]);
		const tags = [...idTags, ...pubkeyTags, ['e', event.id], ['p', event.pubkey]];

		rxNostr?.send({
			kind: kindReaction,
			content: '❤',
			tags
		});
	}
</script>

<div class="post-main grid grid-cols-[auto_1fr] grid-rows-[auto_1fr_auto]">
	<PostUserImage profile={nostrState.profiles[event.pubkey]} />
	<PostHeader {event} profile={nostrState.profiles[event.pubkey]} />

	<div class="py-1 max-h-140 overflow-y-auto">
		{#if refIds.length > 0}
			<div class="ref-link my-2">
				<a href="/{getRefEventCode(event)}" class="border border-thin rounded-md p-1">←返信元</a>
			</div>
		{/if}

		{#if refPubkeys.length > 0}
			<div class="mentions mb-1 text-sm text-thin">
				{#each refPubkeys as pubkey}
					<a class="mr-2" href="/{npubEncode(pubkey)}"
						>{@html formatMention(nostrState.profiles[pubkey], pubkey)}</a
					>
				{/each}
			</div>
		{/if}

		{#if event.kind === 1}
			<PostContent content={event.content} tags={event.tags} />
		{:else if event.kind === 30023 && naddr}
			<a href="/{naddr}" class="border border-thin rounded-md p-1">長文投稿</a>
		{/if}
	</div>

	<div class="flex mt-1">
		<button onclick={handleRepost}><Repeat2 class={repostColor} /></button>

		<button class="ml-8" onclick={handleReaction}>
			<Heart class={reactionColor} />
		</button>
	</div>
</div>
