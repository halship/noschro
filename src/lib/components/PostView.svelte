<script lang="ts">
	import type { Post } from '$lib/models/post';
	import type { Profile } from '$lib/models/profile';
	import Content from './Content.svelte';
	import PostHeader from './PostHeader.svelte';
	import ReplyToUsers from './ReplyToUsers.svelte';
	import UserAvatar from './UserAvatar.svelte';
	import { resolve } from '$app/paths';
	import { npubEncode } from 'nostr-tools/nip19';
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
		<PostHeader {post} {profile} />

		<ReplyToUsers users={replyToUsers} />

		<p class="mb-1 wrap-anywhere break-all whitespace-pre-wrap">
			<Content tokens={post.contentTokens} {quotes} users={contentUsers} />
		</p>
	</div>
</div>
