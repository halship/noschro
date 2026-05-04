<script lang="ts">
	import { pubkeyToColor } from '$lib/formatter';
	import type { Profile } from '$lib/models/profile';
	import { User } from '@lucide/svelte';
	import PostContent from './PostContent.svelte';
	import { parseContent } from '$lib/models/content_token';

	type Props = {
		profile: Profile;
	};

	let { profile }: Props = $props();
</script>

<div class="relative mb-2">
	{#if profile.banner !== undefined}
		<img
			src={profile.banner}
			aria-hidden="true"
			alt="User banner"
			class="h-60 w-full border-b border-gray-600 bg-gray-900 object-cover"
		/>
	{:else}
		<div class="h-60 w-full border-b border-gray-600 bg-gray-900"></div>
	{/if}

	{#if profile.picture !== undefined}
		<img
			src={profile.picture}
			aria-hidden="true"
			alt="User picture"
			class="absolute bottom-2 left-2 h-30 w-30 rounded-full border-2 border-gray-600"
		/>
	{:else}
		<div
			class="absolute bottom-2 left-2 h-30 w-30 rounded-full border-2 border-gray-600"
			style:background-color={pubkeyToColor(profile.pubkey)}
		>
			<User class="h-full w-full rounded-full text-gray-900" />
		</div>
	{/if}
</div>

{#if profile.displayName !== undefined}
	<h1 class="m-2 text-3xl font-bold">
		{profile.displayName}
	</h1>
{/if}

{#if profile.name !== undefined}
	<p class="m-2">@{profile.name}</p>
{/if}

{#if profile.about !== undefined}
	<PostContent contentTokens={parseContent(profile.about)} />
{/if}
