<script lang="ts">
	import { formatPubkey, formatTimestamp, pubkeyToColor } from '$lib/formatter';
	import type { Post } from '$lib/models/post';
	import type { Profile } from '$lib/models/profile';
	import { User } from '@lucide/svelte';
	import PostContent from './PostContent.svelte';
	import { parseContent } from '$lib/models/content_token';

	type Props = {
		post: Post;
		profile?: Profile;
	};

	let { post, profile }: Props = $props();

	let displayName = $derived.by(() => {
		if (
			profile === undefined ||
			(profile?.displayName === undefined && profile?.name === undefined)
		) {
			return formatPubkey(post.pubkey);
		} else if (profile.displayName === undefined) {
			return profile.name;
		} else {
			return profile.displayName;
		}
	});
	let iconColor = $derived(pubkeyToColor(post.pubkey));
</script>

<div class="flex border-b border-gray-600">
	<div class="p-2">
		{#if profile !== undefined && profile.picture !== undefined}
			<img
				src={profile.picture}
				aria-hidden="true"
				alt="profile picture"
				class="h-12 w-12 rounded-full"
			/>
		{:else}
			<div class="default-icon" style:background-color={iconColor}>
				<User class="h-full w-full rounded-full text-gray-900" />
			</div>
		{/if}
	</div>

	<div class="flex flex-1 flex-col">
		<div class="flex gap-2 px-2 pt-2">
			<div class="flex-none font-bold">{displayName}</div>

			{#if profile?.name !== undefined && profile.name !== profile.displayName}
				<div class="flex-none">@{profile.name}</div>
			{/if}

			<div class="flex-1 text-right">{formatTimestamp(post.createdAt)}</div>
		</div>

		<PostContent contentTokens={parseContent(post.content)} />
	</div>
</div>

<style>
	.default-icon {
		width: 48px;
		height: 48px;
		border-radius: 50%;
	}
</style>
