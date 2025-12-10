<script lang="ts">
	import type { NostrProfile } from '$lib/types/nostr';
	import { formatContent } from '$lib/util';

	export let profiles: Record<string, NostrProfile>;
	export let pubkey: string;
</script>

<div class="profile border-thin border rounded-md p-2 mt-2">
	<div class="user-display-name font-bold text-lg wrap-break-word">
		{#if profiles[pubkey]?.display_name}
			{profiles[pubkey].display_name!}
		{:else if profiles[pubkey]?.name}
			@{profiles[pubkey].name}
		{/if}
	</div>

	{#if profiles[pubkey]?.display_name && profiles[pubkey].name}
		<div class="user-name text-thin wrap-break-word">@{profiles[pubkey].name}</div>
	{/if}

	<div class="user-about mt-5 wrap-break-word">
		{@html formatContent(profiles[pubkey].about ?? '', profiles[pubkey].tags)}
	</div>
</div>
