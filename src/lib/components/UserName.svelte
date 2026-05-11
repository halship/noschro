<script lang="ts">
	import { formatPubkey } from '$lib/formatter';
	import type { Profile } from '$lib/models/profile';
	import Content from './Content.svelte';

	type Props = {
		pubkey: string;
		profile?: Profile;
	};

	let { pubkey, profile }: Props = $props();
</script>

{#if profile?.nameTokens}
	<Content tokens={profile.nameTokens} />
{:else if profile?.name}
	{profile.name}
{:else}
	{formatPubkey(pubkey)}
{/if}
