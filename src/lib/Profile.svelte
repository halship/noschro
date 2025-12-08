<script lang="ts">
	import type { NostrProfile } from "$lib/types/nostr";
    import { formatContent } from "$lib/util";

    export let pubkey: string;
    export let profiles: Record<string, NostrProfile>;
</script>

<div class="profile border-thin border rounded-md p-2 mt-2">
    <div class="user-display-name font-bold text-lg wrap-break-word">{profiles[pubkey]?.display_name}</div>
    <div class="user-name text-thin wrap-break-word">@{profiles[pubkey]?.name}</div>
    <div class="user-about mt-5 wrap-break-word">{@html formatContent(profiles[pubkey]?.about ?? '', profiles)}</div>
</div>