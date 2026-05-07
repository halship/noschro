<script lang="ts">
	import { resolve } from '$app/paths';
	import { formatLink, formatPubkey } from '$lib/formatter';
	import type { Quote } from '$lib/models/quote';
	import type { NostrToken } from '$lib/models/token';
	import type { NostrUser } from '$lib/models/user';
	import { npubEncode } from 'nostr-tools/nip19';
	import QuoteItem from './QuoteItem.svelte';

	type Props = {
		tokens: NostrToken[];
		quotes?: Record<string, Quote>;
		users?: Record<string, NostrUser>;
	};

	let { tokens, quotes, users }: Props = $props();
</script>

{#each tokens as token, i (i)}
	{#if token.type === 'text'}
		<span>{token.text}</span>
	{:else if token.type === 'link'}
		<a href={token.url} rel="external" target="_blank" class="underline">{formatLink(token.url)}</a>
	{:else if token.type === 'image'}
		<a href={token.url} rel="external" target="_blank"
			><img src={token.url} class="my-1 max-h-80 rounded-md border" alt="content" /></a
		>
	{:else if token.type === 'emoji'}
		<img src={token.url} alt={token.shortcode} class="inline-block size-5" />
	{:else if token.type === 'quote'}
		{#if quotes && token.eventId in quotes}
			<QuoteItem
				post={quotes[token.eventId].post}
				profile={quotes[token.eventId].profile}
				quotes={quotes[token.eventId].quotes}
			/>
		{:else}
			<span>{token.raw}</span>
		{/if}
	{:else if token.type === 'user'}
		<a href={resolve('/[npub=npub]', { npub: npubEncode(token.pubkey) })} class="text-gray-500">
			{#if users}
				@{users[token.pubkey].displayName ?? users[token.pubkey].name ?? formatPubkey(token.pubkey)}
			{:else}
				@{formatPubkey(token.pubkey)}
			{/if}
		</a>
	{/if}
{/each}
