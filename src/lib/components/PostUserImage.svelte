<script lang="ts">
	import type { NostrProfile } from '$lib/types/nostr';
	import { getLoadImage } from '$lib/util';
	import { npubEncode } from 'nostr-tools/nip19';

	export let pubkey: string;
	export let profiles: Record<string, NostrProfile>;
</script>

<div class="post-image mr-2 row-span-2">
	<a href="/{npubEncode(pubkey)}">
		{#if getLoadImage() && profiles[pubkey]?.picture}
			<img
				src={profiles[pubkey].picture}
				alt={profiles[pubkey].name}
				class="w-[50px] h-[50px] rounded-full"
			/>
		{:else}
			<div class="w-[50px] h-[50px] rounded-full border border-thin"></div>
		{/if}
	</a>
</div>
