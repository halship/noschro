<script lang="ts">
    import { bufferTime } from "rxjs";
	import { batch, createRxForwardReq, createRxNostr } from "rx-nostr";
    import { verifier } from "@rx-nostr/crypto";
    import { onMount } from "svelte";
    import type { NostrEvent, NostrProfile } from "$lib/types/nostr";
    import DOMPurify from "isomorphic-dompurify";
    
    const relayUrls: string[] = [
        'wss://yabu.me',
        'wss://relay-jp.nostr.wirednet.jp',
        'wss://nrelay-jp.c-stellar.net',
    ];

    let profiles: Record<string, NostrProfile | undefined> = $state({});
    let events: NostrEvent[] = $state([]);
    
    onMount(() => {
        const rxNostr = createRxNostr({ verifier });
        rxNostr.setDefaultRelays(relayUrls);

        const rxReqTimeline = createRxForwardReq();
        const rxReqProfile = createRxForwardReq();

        // タイムライン購読
        const timelineSub = rxNostr.use(rxReqTimeline).subscribe({
            next: ({ event }) => {
                if (event.kind !== 1) return;

                if (!(event.pubkey in profiles)) {
                    rxReqProfile.emit({
                        kinds: [0],
                        authors: [event.pubkey],
                        limit: 1,
                    });
                }

                if (events.find((ev) => ev.id == event.id)) {
                    return;
                }

                if (events.length == 100) {
                    events = events.slice(0, -1);
                }

                events = [
                    {
                        id: event.id,
                        pubkey: event.pubkey,
                        kind: event.kind,
                        created_at: event.created_at,
                        tags: event.tags,
                        content: event.content,
                    },
                    ...events,
                ].sort((a, b) => b.created_at - a.created_at);
            },
            error: (err) => {
                console.error(err);
            },
        });

        // プロフィール購読
        const rxReqBatched = rxReqProfile.pipe(bufferTime(1000), batch());
        const profileSub = rxNostr.use(rxReqBatched).subscribe({
            next: ({ event }) => {
                if (event.kind !== 0) return;

                try {
                    const meta = JSON.parse(event.content) as {
                        name?: string;
                        display_name?: string;
                        picture?: string;
                        about?: string;
                    };

                    const profile: NostrProfile = {
                        pubkey: event.pubkey,
                        name: meta.name,
                        display_name: meta.display_name,
                        picture: meta.picture,
                        about: meta.about,
                    };

                    profiles = {
                        ...profiles,
                        [event.pubkey]: profile,
                    };
                } catch (e) {
                    console.warn('Failed to parse profile metadata', e);
                }
            },
            error: (err) => {
                console.error(err);
            },
        });

        rxReqTimeline.emit({
            kinds: [1],
            limit: 20,
        });

        return () => {
            timelineSub.unsubscribe();
            profileSub.unsubscribe();
        };
    });

    function formatTime(ts: number) {
        return new Date(ts * 1000).toLocaleString();
    }

    function formatContent(content: string) {
        return DOMPurify.sanitize(content)
            .replace(/(http[^\s]+)/g, '<a href="$1">$1</a>')
            .replaceAll('\n', '<br>\n');
    }
</script>

<div id="posts">
    {#each events as ev (ev.id)}
        <div id={ev.id} class="post">
            <div class="post-header">
                <div class="user-display-name">
                    {#if !(ev.pubkey in profiles)}
                        {ev.pubkey}
                    {:else if profiles[ev.pubkey]?.display_name}
                        {profiles[ev.pubkey]?.display_name}
                    {:else if profiles[ev.pubkey]?.name}
                        {profiles[ev.pubkey]?.name}
                    {/if}
                </div>
                <div class="user-name">
                    {#if (ev.pubkey in profiles) && profiles[ev.pubkey]?.display_name && profiles[ev.pubkey]?.name}
                        @{profiles[ev.pubkey]?.name}
                    {/if}
                </div>

                <div class="post-created-at">{formatTime(ev.created_at)}</div>
            </div>

            <div class="post-content">{@html formatContent(ev.content)}</div>
        </div>
    {/each}
</div>

<style>
    .post {
        border: 1px solid #aaaaaa;
        border-radius: 8px;
        padding: 0.5em;
        margin-top: 1em;
        overflow-wrap: break-word;
    }

    .post-header {
        margin-bottom: 0.5em;
        display: grid;
        grid-template-columns: auto 1fr auto;
    }

    .user-display-name {
        font-weight: bold;
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        margin-right: 0.5em;
    }

    .user-name {
        color: #aaaaaa;
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        margin-right: 0.5em;
    }

    .post-created-at {
        color: #aaaaaa;
        text-align: right;
    }
</style>