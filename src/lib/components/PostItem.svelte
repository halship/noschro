<script lang="ts">
	import { formatPubkey, formatTimestamp, pubkeyToColor } from '$lib/formatter';
	import type { Post } from '$lib/models/post';
	import type { Profile } from '$lib/models/profile';
	import { User } from '@lucide/svelte';
	import Content from './Content.svelte';
	import { parseContent } from '$lib/models/token';
	import { resolve } from '$app/paths';
	import { npubEncode, neventEncode } from 'nostr-tools/nip19';

	type Props = {
		post: Post;
		profile?: Profile;
	};

	let { post, profile }: Props = $props();

	let iconColor = $derived(pubkeyToColor(post.pubkey));

	let userNpub = $derived(npubEncode(post.pubkey));

	let postNevent = $derived(
		neventEncode({
			id: post.id,
			author: post.pubkey,
			kind: 1
		})
	);
</script>

<div class="flex border-b border-border">
	<div class="p-2">
		<a href={resolve('/[npub=npub]', { npub: userNpub })}>
			{#if profile && profile.picture}
				<img
					src={profile.picture}
					aria-hidden="true"
					alt="profile picture"
					class="h-12 w-12 rounded-full"
				/>
			{:else}
				<div class="default-icon" style:background-color={iconColor}>
					<User class="text-app-text size-full rounded-full" />
				</div>
			{/if}
		</a>
	</div>

	<div class="flex flex-1 flex-col">
		<div class="flex flex-wrap gap-x-2 px-2 pt-2">
			<div class="flex-none font-bold break-all">
				{#if profile?.displayName}
					<Content tokens={parseContent(profile.displayName, profile.tags)} />
				{:else if profile?.name}
					{profile.name}
				{:else}
					{formatPubkey(post.pubkey)}
				{/if}
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

		<p class="px-2 pb-2 wrap-anywhere break-all whitespace-pre-wrap">
			<Content tokens={parseContent(post.content, post.tags)} />
		</p>
	</div>
</div>

<style>
	.default-icon {
		width: 48px;
		height: 48px;
		border-radius: 50%;
	}
</style>
