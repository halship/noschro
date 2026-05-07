<script lang="ts">
	import { resolve } from '$app/paths';
	import { formatPubkey, formatTimestamp } from '$lib/formatter';
	import type { Post } from '$lib/models/post';
	import type { Profile } from '$lib/models/profile';
	import type { Quote } from '$lib/models/quote';
	import { parseContent } from '$lib/models/token';
	import { neventEncode, npubEncode } from 'nostr-tools/nip19';
	import Content from './Content.svelte';
	import type { NostrUser } from '$lib/models/user';

	type Props = {
		post: Post;
		profile?: Profile;
		quotes?: Record<string, Quote>;
		users?: Record<string, NostrUser>;
	};

	let { post, profile, quotes, users }: Props = $props();

	let userNpub = $derived(npubEncode(post.pubkey));

	let postNevent = $derived(
		neventEncode({
			id: post.id,
			author: post.pubkey,
			kind: 1
		})
	);
</script>

<div class="my-2 flex flex-col border border-gray-400 p-2 dark:border-gray-700">
	<div class="mb-1 flex flex-wrap gap-x-2">
		<div class="flex-none font-bold break-all">
			<a href={resolve('/[npub=npub]', { npub: userNpub })}>
				{#if profile?.displayName}
					<Content tokens={parseContent(profile.displayName, profile.tags)} />
				{:else if profile?.name}
					{profile.name}
				{:else}
					{formatPubkey(post.pubkey)}
				{/if}
			</a>
		</div>

		<div class="flex-1 text-right">
			<a href={resolve('/[nevent=nevent]', { nevent: postNevent })}
				>{formatTimestamp(post.createdAt)}</a
			>
		</div>
	</div>

	<p class="mb-1 wrap-anywhere break-all whitespace-pre-wrap">
		<Content tokens={post.contentTokens} {quotes} {users} />
	</p>
</div>
