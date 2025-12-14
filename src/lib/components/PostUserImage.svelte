<script lang="ts">
	import type { NostrProfile, NostrState } from '$lib/types/nostr';
	import { getSetting } from '$lib/util';
	import { npubEncode } from 'nostr-tools/nip19';

	let { profile }: { profile: NostrProfile } = $props();

	let loadImage = getSetting('load-image') === 'true';
</script>

<div class="post-image row-span-3" class:mr-2={loadImage}>
	{#if loadImage}
		<a href="/{npubEncode(profile.pubkey)}">
			{#if profile?.picture}
				<img src={profile.picture} alt={profile.name} class="w-[50px] h-[50px] rounded-full" />
			{:else}
				<div class="w-[50px] h-[50px] rounded-full border border-thin"></div>
			{/if}
		</a>
	{/if}
</div>
