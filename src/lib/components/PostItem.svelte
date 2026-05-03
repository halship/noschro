<script lang="ts">
	import { formatPubkey, formatTimestamp, pubkeyToColor } from '$lib/formatter';
	import type { Post } from '$lib/models/post';
	import { User } from '@lucide/svelte';

	type Props = {
		post: Post;
	};

	let { post }: Props = $props();

	let displayName = $derived(formatPubkey(post.pubkey));
	let iconColor = $derived(pubkeyToColor(post.pubkey));
</script>

<div class="flex border-b border-gray-600">
	<div class="p-2">
		<div class="default-icon" style:background-color={iconColor}>
			<User class="h-full w-full rounded-full text-gray-900" />
		</div>
	</div>

	<div class="flex flex-1 flex-col">
		<div class="flex gap-2 px-2 pt-2">
			<div class="flex-none">{displayName}</div>
			<div class="flex-1 text-right">{formatTimestamp(post.createdAt)}</div>
		</div>

		<div class="px-2 pb-2 wrap-anywhere break-all">{post.content}</div>
	</div>
</div>

<style>
	.default-icon {
		width: 40px;
		height: 40px;
		border-radius: 50%;
	}
</style>
