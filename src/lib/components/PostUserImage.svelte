<script lang="ts">
	import type { NostrProfile } from '$lib/types/nostr';
	import { getSetting } from '$lib/util';
	import { npubEncode } from 'nostr-tools/nip19';

	export let pubkey: string;
	export let profiles: Record<string, NostrProfile>;

	let loadImage = getSetting('load-image') === 'true';
</script>

<div class="post-image row-span-2" class:mr-2={loadImage}>
	{#if loadImage}
		<a href="/{npubEncode(pubkey)}">
			{#if profiles[pubkey]?.picture}
				<img
					src={profiles[pubkey].picture}
					alt={profiles[pubkey].name}
					class="w-[50px] h-[50px] rounded-full"
				/>
			{:else}
				<div class="w-[50px] h-[50px] rounded-full border border-thin"></div>
			{/if}
		</a>
	{/if}
</div>
