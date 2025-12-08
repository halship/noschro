<script lang="ts">
	import type { NostrProfile } from '$lib/types/nostr';
	import { formatContent } from '$lib/util';
	import { nostrState } from './state.svelte';

	let { pubkey } = $props();

	let profile: NostrProfile | undefined = $derived(nostrState.profiles[pubkey]);
</script>

<div class="profile border-thin border rounded-md p-2 mt-2">
	<div class="user-display-name font-bold text-lg wrap-break-word">
		{profile?.display_name}
	</div>
	<div class="user-name text-thin wrap-break-word">@{profile?.name}</div>
	<div class="user-about mt-5 wrap-break-word">
		{@html formatContent(profile?.about ?? '')}
	</div>
</div>
