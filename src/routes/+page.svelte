<script lang="ts">
    import { bufferTime, Subject } from "rxjs";
	import { batch, createRxForwardReq, sortEvents, uniq } from "rx-nostr";
    import { onMount } from "svelte";
    import type { NostrEvent, NostrProfile, NostrClient, NostrRef } from "$lib/types/nostr";
    import Post from "$lib/Post.svelte";
    import { getNostrClient } from '$lib/types/nostr';
    import { MoveUp } from "@lucide/svelte";

    let profiles: Record<string, NostrProfile> = $state({});
    let events: NostrEvent[] = $state([]);
    let nostrRefs: Record<string, NostrRef> = $state({});

    const rxReqTimeline = createRxForwardReq();
    const rxReqProfile = createRxForwardReq();
    const rxReqDelete = createRxForwardReq();
    const flushesTimeline$ = new Subject<void>();
    const flushesProfile$ = new Subject<void>();
    const flushesDelete$ = new Subject<void>();

    let client: NostrClient | null = null;
    let timelineSub: any = null;
    let profileSub: any = null;
    let deleteSub: any = null;
    
    onMount(() => {
        client = getNostrClient();

        // タイムライン購読
        timelineSub = client.rx_nostr.use(rxReqTimeline)
            .pipe(uniq(flushesTimeline$))
            .pipe(sortEvents(500))
            .subscribe({
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

                const refId = event.tags.filter((tag) => tag[0] === 'e');
                const refPubkey = event.tags.filter((tag) => tag[0] === 'p');

                if (refId.length !== 0 && refPubkey.length !== 0) {
                    const nostrRef = {
                        id: refId[0][1],
                        pubkey: refPubkey[0][1],
                    };

                    nostrRefs = {...nostrRefs, [nostrEvent.id]: nostrRef};
                }
            },
            error: (err) => {
                console.error(err);
            },
        });
        flushesTimeline$.next();

        // プロフィール購読
        const rxReqBatched = rxReqProfile.pipe(bufferTime(500), batch());
        profileSub = client.rx_nostr.use(rxReqBatched)
            .pipe(uniq(flushesProfile$))
            .subscribe({
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
        flushesProfile$.next();

        // 削除イベント購読
        deleteSub = client.rx_nostr.use(rxReqDelete)
            .pipe(uniq(flushesDelete$))
            .subscribe({
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
        });
        flushesDelete$.next();

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

    function scrollUp() {
        window.scroll({
            top: 0,
            behavior: 'instant',
        });
    }

    function switchScrollUpButton() {
        const element = document.getElementById('scroll-up-btn');;
        element?.classList.toggle('hidden', window.scrollY <= 0);
    }
</script>

<svelte:window onscroll={switchScrollUpButton} />

<div id="posts">
    {#each events as ev (ev.id)}
        <Post event={ev} profile={profiles[ev.pubkey]} nostr_ref={nostrRefs[ev.id]} />
    {/each}
</div>

<button id="scroll-up-btn"
    class="bg-light dark:bg-dark border-dark dark:border-light border p-2 fixed bottom-5 right-5"
    onclick={scrollUp}>
    <MoveUp />
</button>