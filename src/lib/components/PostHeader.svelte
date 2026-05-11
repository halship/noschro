<script lang="ts">
	import { resolve } from '$app/paths';
	import { formatTimestamp } from '$lib/formatter';
	import type { Post } from '$lib/models/post';
	import type { Profile } from '$lib/models/profile';
	import { neventEncode } from 'nostr-tools/nip19';
	import UserName from './UserName.svelte';

	type Props = {
		post: Post;
		profile?: Profile;
	};

	let { post, profile }: Props = $props();

	let postNevent = $derived(
		neventEncode({
			id: post.id,
			author: post.pubkey,
			kind: 1
		})
	);
</script>

<div class="mb-1 flex flex-wrap gap-x-2">
	<div class="flex-none font-bold break-all">
		<UserName pubkey={post.pubkey} {profile} />
	</div>

	{#if profile?.displayName !== undefined && profile.displayName.trim() !== '' && profile?.name !== undefined}
		<div class="flex-none break-all">@{profile.name}</div>
	{/if}

	<div class="flex-1 text-right">
		<a href={resolve('/[nevent=nevent]', { nevent: postNevent })}
			>{formatTimestamp(post.createdAt)}</a
		>
	</div>
</div>
