<script lang="ts">
	import type { Profile } from '$lib/models/profile';
	import { Repeat } from '@lucide/svelte';
	import Content from './Content.svelte';
	import { formatPubkey } from '$lib/formatter';

	type Props = {
		pubkey: string;
		profile?: Profile;
	};

	let { pubkey, profile }: Props = $props();
</script>

<div class="px-2 pt-1">
	<Repeat class="inline-block size-4 text-green-600" />
	<span>
		{#if profile?.nameTokens}
			<Content tokens={profile.nameTokens} />
		{:else if profile?.name}
			{profile.name}
		{:else}
			{formatPubkey(pubkey)}
		{/if}
	</span>
</div>
