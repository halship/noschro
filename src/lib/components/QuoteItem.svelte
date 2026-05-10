<script lang="ts">
	import type { Post } from '$lib/models/post';
	import type { Profile } from '$lib/models/profile';
	import type { NostrUser } from '$lib/models/user';
	import type { PostItem } from '$lib/models/timeline';
	import PostView from './PostView.svelte';

	type Props = {
		post: Post;
		profile?: Profile;
		replyToUsers: NostrUser[];
		quotes?: Record<string, PostItem>;
		contentUsers?: Record<string, NostrUser>;
	};

	let { post, profile, replyToUsers, quotes, contentUsers }: Props = $props();
</script>

<div class="my-2 border-x border-t border-gray-400 dark:border-gray-700">
	<PostView {post} {profile} {replyToUsers} {quotes} {contentUsers} />
</div>
