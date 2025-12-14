<script lang="ts">
	import type { NostrProfile } from '$lib/types/nostr';
	import { getSetting } from '$lib/util';
	import { formatDisplayName } from '$lib/formatter';
	import PostContent from './PostContent.svelte';

	let { profile }: { profile: NostrProfile } = $props();
</script>

<div class="profile border-thin border rounded-md mt-2 overflow-hidden">
	{#if getSetting('load-image') === 'true'}
		<div class="relative h-[230px] w-full bg-thin">
			{#if profile.banner}
				<img
					src={profile.banner}
					alt="banner"
					class="h-[230px] w-full object-cover object-center"
				/>
			{/if}

			{#if profile.picture}
				<img
					src={profile.picture}
					alt="pictures"
					class="rounded-full w-[120px] border-2 border-light absolute left-2 bottom-2"
				/>
			{/if}
		</div>
	{/if}

	<div class="p-2">
		<div class="user-display-name font-bold text-lg wrap-break-word">
			{#if profile.display_name}
				{@html formatDisplayName(profile.display_name!, profile.tags)}
			{:else if profile.name}
				@{profile.name}
			{/if}
		</div>

		{#if profile.display_name && profile.name}
			<div class="user-name text-thin wrap-break-word">@{profile.name}</div>
		{/if}

		<div class="user-about mt-5">
			<PostContent content={profile.about ?? ''} tags={profile.tags} />
		</div>
	</div>
</div>
