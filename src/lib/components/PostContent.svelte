<script lang="ts">
	import { kindMetaData, kindsEvent } from '$lib/consts';
	import { tokenize } from '$lib/formatter';
	import { rxReqEvent, rxReqProfiles } from '$lib/timelines/base_timeline';
	import type { NostrEvent, NostrProfile } from '$lib/types/nostr';
	import { Emoji, Image, Link, LongContent, Reference, Text, User, Video } from '$lib/types/token';
	import { getSetting } from '$lib/util';
	import { SquareArrowOutUpRight } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import Post from './Post.svelte';

	export let content: string;
	export let tags: string[][];
	export let eventsById: Record<string, NostrEvent>;
	export let profiles: Record<string, NostrProfile>;

	let tokens = tokenize(content);
	let emojis: Record<string, string> = tags
		.filter((tag) => tag[0] === 'emoji')
		.reduce((result, tag) => {
			return { ...result, [tag[1]]: tag[2] };
		}, {});
	let loadImage = getSetting('load-image') === 'true';

	onMount(() => {
		for (const token of tokens) {
			if (token instanceof Reference && !(token.id in eventsById)) {
				rxReqEvent.emit({
					kinds: kindsEvent,
					ids: [token.id],
					limit: 1
				});
			} else if (token instanceof User && !(token.pubkey in profiles)) {
				rxReqProfiles.emit({
					kinds: [kindMetaData],
					authors: [token.pubkey],
					limit: 1
				});
			}
		}
	});
</script>

<div class="nostr-content leading-none mb-1">
	{#each tokens as token}
		{#if token instanceof Text}
			{@html token.value}
		{:else if token instanceof Image}
			{#if loadImage}
				<a href={token.url} target="_blank">
					<img
						src={token.url}
						alt="post-images"
						class="block object-contain max-h-80 max-w-full my-3 rounded-md border border-thin"
					/>
				</a>
			{:else}
				<a href={token.url} target="_blank" class="underline"
					>[画像]<SquareArrowOutUpRight class="inline-block size-4" /></a
				>
			{/if}
		{:else if token instanceof Video}
			{#if loadImage}
				<video
					controls
					class="block object-contain max-h-80 max-w-full my-3 rounded-md border border-thin"
				>
					<source src={token.url} type="video/mp4" />
					<track kind="captions" />
				</video>
			{:else}
				<a href={token.url} target="_blank" class="underline"
					>[ビデオ]<SquareArrowOutUpRight class="inline-block size-4" /></a
				>
			{/if}
		{:else if token instanceof Link}
			<a href={token.url} target="_blank" class="underline"
				>{token.url}<SquareArrowOutUpRight class="inline-block size-4" /></a
			>
		{:else if token instanceof Reference}
			{#if getSetting('expand-ref') === 'true' && token.id in eventsById}
				<Post event={eventsById[token.id]} {profiles} {eventsById} />
			{:else}
				<a href="/{token.code}" class="underline">[引用]</a>
			{/if}
		{:else if token instanceof LongContent}
			<a href="/{token.code}" class="underline">[長文投稿]</a>
		{:else if token instanceof User}
			<a href="/{token.code}">
				{#if token.pubkey in profiles}
					{#if profiles[token.pubkey].display_name}
						@{profiles[token.pubkey].display_name}
					{:else if profiles[token.pubkey].name}
						@{profiles[token.pubkey].name}
					{:else}
						@token.code.slice(0, 9)}
					{/if}
				{:else}
					@{token.code.slice(0, 9)}
				{/if}
			</a>
		{:else if token instanceof Emoji}
			{#if loadImage && token.code in emojis}
				<img src={emojis[token.code]} alt="emoji" class="inline-block max-w-[1em]" />
			{:else}
				:{token.code}:
			{/if}
		{/if}
	{/each}
</div>
