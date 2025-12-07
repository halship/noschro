<script lang="ts">
    import { bufferTime } from "rxjs";
	import { batch, createRxForwardReq, sortEvents } from "rx-nostr";
    import { onMount } from "svelte";
    import type { NostrEvent, NostrProfile, NostrClient } from "$lib/types/nostr";
    import Post from "$lib/Post.svelte";
    import { getNostrClient } from '$lib/types/nostr';

    let profiles: Record<string, NostrProfile> = $state({});
    let events: NostrEvent[] = $state([]);

    const rxReqTimeline = createRxForwardReq();
    const rxReqProfile = createRxForwardReq();
    const rxReqDelete = createRxForwardReq();

    let client: NostrClient | null = null;
    let timelineSub: any = null;
    let profileSub: any = null;
    let deleteSub: any = null;
    
    onMount(() => {
        client = getNostrClient();

        // タイムライン購読
        timelineSub = client.rx_nostr.use(rxReqTimeline).pipe(sortEvents(500)).subscribe({
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

                const nostrEvent: NostrEvent = {
                    id: event.id,
                    pubkey: event.pubkey,
                    kind: event.kind,
                    created_at: event.created_at,
                    tags: event.tags,
                    content: event.content,
                };

                events = [nostrEvent, ...events].slice(0, 100);
            },
            error: (err) => {
                console.error(err);
            },
        });

        // プロフィール購読
        const rxReqBatched = rxReqProfile.pipe(bufferTime(500), batch());
        profileSub = client.rx_nostr.use(rxReqBatched).subscribe({
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

        // 削除イベント購読
        deleteSub = client.rx_nostr.use(rxReqDelete).subscribe({
            next: ({ event }) => {
                if (event.kind != 5) return;

                const ids = event.tags.filter((tag) => tag[0] === 'e')
                    .map((tag) => tag[1]);

                if (ids.length == 0) return;

                events = events.filter((ev) => ev.id !== ids[0]);
            },
            error: (err) => {
                console.error(err);
            },
        })

        rxReqTimeline.emit({
            kinds: [1],
            limit: 10,
        });
        rxReqDelete.emit({
            kinds: [5],
            limit: 10,
        });

        return () => {
            timelineSub.unsubscribe();
            profileSub.unsubscribe();
            deleteSub.unsubscribe();
        };
    });
</script>

<div id="posts">
    {#each events as ev (ev.id)}
        <Post event={ev} profiles={profiles} />
    {/each}
</div>
