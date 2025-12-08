<script lang="ts">
	import type { NostrEvent, NostrProfile, NostrRef } from "$lib/types/nostr";
	import { neventEncode, npubEncode } from "nostr-tools/nip19";
    import { formatContent } from "$lib/util";

    export let event: NostrEvent;
    export let profiles: Record<string, NostrProfile>;
    export let nostr_ref: NostrRef | null;

    // 整数で表現された日時を表示用に整形する
    function formatTime(ts: number) {
        return new Date(ts * 1000).toLocaleString();
    }

    function getEventCode(ev: NostrEvent): string {
        return neventEncode({
            id: ev.id,
            author: ev.pubkey,
        });
    }

    function getRefEventCode(ev:NostrEvent, nf: NostrRef): string {
        return neventEncode({
            id: nf.id,
            author: nf.pubkey,
        });
    }
</script>

<div id={event.id} class="post border-thin border rounded-md p-2 mt-2">
    <div class="post-header mb-1 flex">
        <span class="user-display-name font-bold grow-0 shrink basis-auto min-w-0 whitespace-nowrap overflow-hidden mr-1">
            <a href="/{npubEncode(event.pubkey)}">
                {#if profiles[event.pubkey]?.display_name}
                    {profiles[event.pubkey]?.display_name}
                {:else if profiles[event.pubkey]?.name}
                    {profiles[event.pubkey]?.name}
                {:else}
                    {event.pubkey.substring(0, 9)}
                {/if}
            </a>
        </span>
        
        <span class="user-name text-thin grow shrink min-w-0 whitespace-nowrap overflow-hidden mr-1">
            {#if profiles[event.pubkey]?.display_name && profiles[event.pubkey]?.name && profiles[event.pubkey]?.display_name!==profiles[event.pubkey]?.name}
                @{profiles[event.pubkey]?.name}
            {/if}
        </span>

        <span class="post-created-at text-thin grow-0 shrink-0 basis-auto"><a href="/{getEventCode(event)}" class="underline">{formatTime(event.created_at)}</a></span>
    </div>

    {#if nostr_ref}
        <div class="ref-link underline">
            <a href="/{getRefEventCode(event, nostr_ref)}">[参照]</a>
        </div>
    {/if}

    <div class="post-content wrap-break-word">{@html formatContent(event.content, profiles)}</div>
</div>
