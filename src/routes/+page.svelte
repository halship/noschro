<script lang="ts">
    import { bufferTime } from "rxjs";
	import { batch, createRxForwardReq, createRxNostr, latest, sortEvents } from "rx-nostr";
    import { verifier } from "@rx-nostr/crypto";
    import { onMount } from "svelte";
    import type { NostrEvent, NostrProfile } from "$lib/types/nostr";
    import Post from "$lib/Post.svelte";
    
    const relayUrls: string[] = [
        'wss://yabu.me',
        'wss://relay-jp.nostr.wirednet.jp',
        'wss://nrelay-jp.c-stellar.net',
    ];

    let profiles: Record<string, NostrProfile> = $state({});
    let events: NostrEvent[] = $state([]);
    
    onMount(() => {
        const rxNostr = createRxNostr({ verifier });
        rxNostr.setDefaultRelays(relayUrls);

        const rxReqTimeline = createRxForwardReq();
        const rxReqProfile = createRxForwardReq();

        // タイムライン購読
        const timelineSub = rxNostr.use(rxReqTimeline).pipe(sortEvents(1000)).subscribe({
            next: ({ event }) => {
                if (event.kind !== 1) return;
                if (events.find((ev) => ev.id == event.id)) return;

                if (!(event.pubkey in profiles)) {
                    rxReqProfile.emit({
                        kinds: [0],
                        authors: [event.pubkey],
                        limit: 1,
                    });
                }

                if (events.length == 100) {
                    events.pop();
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
                ];
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
</script>

<div id="posts">
    {#each events as ev (ev.id)}
        <Post event={ev} profiles={profiles} />
    {/each}
</div>
