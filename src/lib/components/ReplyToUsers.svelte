<script lang="ts">
	import { resolve } from '$app/paths';
	import { formatPubkey } from '$lib/formatter';
	import type { NostrUser } from '$lib/models/user';
	import { npubEncode } from 'nostr-tools/nip19';

	type Props = {
		users: NostrUser[];
	};

	let { users }: Props = $props();
</script>

{#if users.length > 0}
	<div class="mb-1 wrap-anywhere break-all">
		<span>To:</span>
		{#each users as user, i (i)}
			<a
				href={resolve('/[npub=npub]', { npub: npubEncode(user.pubkey) })}
				class="ml-1 text-gray-500">@{user.displayName ?? user.name ?? formatPubkey(user.pubkey)}</a
			>
		{/each}
	</div>
{/if}
