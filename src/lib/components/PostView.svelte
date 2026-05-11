<script lang="ts">
	import { formatTimestamp } from '$lib/formatter';
	import type { Post } from '$lib/models/post';
	import type { Profile } from '$lib/models/profile';
	import Content from './Content.svelte';
	import ReplyToUsers from './ReplyToUsers.svelte';
	import UserAvatar from './UserAvatar.svelte';
	import UserName from './UserName.svelte';
	import { resolve } from '$app/paths';
	import { npubEncode, neventEncode } from 'nostr-tools/nip19';
	import type { NostrUser } from '$lib/models/user';
	import type { PostItem } from '$lib/models/timeline';

	type Props = {
		post: Post;
		profile?: Profile;
		replyToUsers: NostrUser[];
		quotes?: Record<string, PostItem>;
		contentUsers?: Record<string, NostrUser>;
	};

	let { post, profile, replyToUsers, quotes, contentUsers }: Props = $props();

	let userNpub = $derived(npubEncode(post.pubkey));

	let postNevent = $derived(
		neventEncode({
			id: post.id,
			author: post.pubkey,
			kind: 1
		})
	);
</script>

<div class="flex border-b border-gray-400 dark:border-gray-700">
	<div class="m-2">
		<a href={resolve('/[npub=npub]', { npub: userNpub })}>
			<UserAvatar
				pubkey={post.pubkey}
				picture={profile?.picture}
				alt="profile picture"
				class="h-12 w-12 rounded-full"
			/>
		</a>
	</div>

	<div class="m-2 flex flex-1 flex-col">
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

		<ReplyToUsers users={replyToUsers} />

		<p class="mb-1 wrap-anywhere break-all whitespace-pre-wrap">
			<Content tokens={post.contentTokens} {quotes} users={contentUsers} />
		</p>
	</div>
</div>
