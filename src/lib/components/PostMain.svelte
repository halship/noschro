<script lang="ts">
	import { naddrEncode, neventEncode, npubEncode } from 'nostr-tools/nip19';
	import type { NostrEvent } from '$lib/types/nostr';
	import PostHeader from './PostHeader.svelte';
	import PostUserImage from './PostUserImage.svelte';
	import PostContent from './PostContent.svelte';
	import { Quote, Repeat2, Star } from '@lucide/svelte';
	import { rxNostr } from '$lib/timelines/base_timeline';
	import { kindReaction, kindRepost, reactionEmoji } from '$lib/consts';
	import { getEmojis, getRefIds, getRefPubkeys } from '$lib/util';
	import { nostrState } from '$lib/state.svelte';
	import { pubkey } from '$lib/signer';
	import { goto } from '$app/navigation';
	import FormatedText from './FormatedText.svelte';

	let { event }: { event: NostrEvent } = $props();

	let refIds: string[] = $derived(
		event.tags.filter((t) => t[0] === 'e' || t[0] === 'q').map((t) => t[1])
	);
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
		if (!(event.id in nostrState.repostsById)) {
			return 'text-thin';
		}
		const id = nostrState.repostsById[event.id];
		if (nostrState.eventsById[id].pubkey === pubkey!) {
			return 'text-repost';
		} else {
			return 'text-thin';
		}
	});

	let reactionColor: string = $derived.by(() => {
		if (!(event.id in nostrState.reactionsById)) {
			return 'text-thin';
		}
		const id = nostrState.reactionsById[event.id];
		if (nostrState.eventsById[id].pubkey === pubkey!) {
			return 'text-reaction';
		} else {
			return 'text-thin';
		}
	});

	let refEventCode: string = $derived(
		neventEncode({
			id: refIds.slice(-1)[0],
			author: refPubkeys.slice(-1).at(0)
		})
	);

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

	function handleQuote() {
		const nevent = neventEncode({
			id: event.id,
			author: event.pubkey
		});
		goto(`/post?quote=${nevent}`);
	}

	function handleReaction() {
		const idTags = getRefIds(event.tags).map((id) => ['e', id]);
		const pubkeyTags = getRefPubkeys(event.tags).map((pub) => ['p', pub]);
		const tags = [...idTags, ...pubkeyTags, ['e', event.id], ['p', event.pubkey]];

		rxNostr?.send({
			kind: kindReaction,
			content: reactionEmoji,
			tags
		});
	}
</script>

<div class="post-main grid grid-cols-[auto_1fr] grid-rows-[auto_1fr_auto]">
	<PostUserImage profile={nostrState.profiles[event.pubkey]} />
	<PostHeader
		{event}
		profile={nostrState.profiles[event.pubkey]}
		user_status={nostrState.userGeneralStatuses[event.pubkey]}
	/>

	<div class="mt-1 py-1 max-h-140 overflow-y-auto">
		{#if refIds.length > 0}
			<div class="ref-link my-2">
				<a href="/{refEventCode}" class="border border-thin rounded-md p-1">←返信元</a>
			</div>
		{/if}

		{#if refPubkeys.length > 0}
			<div class="mentions mb-1 text-sm text-thin">
				{#each refPubkeys as pubkey}
					<a class="mr-2" href="/{npubEncode(pubkey)}">
						{#if pubkey in nostrState.profiles}
							{#if nostrState.profiles[pubkey].display_name}
								@<FormatedText
									text={nostrState.profiles[pubkey].display_name}
									emojis={getEmojis(nostrState.profiles[pubkey].tags)}
								/>
							{:else if nostrState.profiles[pubkey].name}
								@{nostrState.profiles[pubkey].name}
							{:else}
								@{npubEncode(pubkey).slice(0, 9)}
							{/if}
						{:else}
							@{npubEncode(pubkey).slice(0, 9)}
						{/if}
					</a>
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

		<button class="ml-8 text-thin" onclick={handleQuote}><Quote /></button>

		<button class="ml-8 text-thin" onclick={handleReaction}>
			<Star class={reactionColor} />
		</button>
	</div>
</div>
