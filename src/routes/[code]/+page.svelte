<script lang="ts">
	import type { NostrClient, NostrEvent, NostrProfile, NostrRef } from '$lib/types/nostr';
    import { getNostrClient } from '$lib/types/nostr';
    import Post from '$lib/Post.svelte';
	import { onMount } from 'svelte';
	import { batch, createRxForwardReq, uniq } from 'rx-nostr';
	import Profile from '$lib/Profile.svelte';
	import { bufferTime, Subject } from 'rxjs';
	import { decodeNostrURI } from 'nostr-tools/nip19';

	let { data } = $props();

    let kind: string | null = $state(null);
    let nostrEvent: NostrEvent | null = $state(null);
    let profiles: Record<string, NostrProfile> = $state({});
    let nostrRef: NostrRef | null = $state(null);
    let pubkey: string | null = $state(null);

    const rxReqTimeline = createRxForwardReq();
    const rxReqProfile = createRxForwardReq();
    const flushesTimeline$ = new Subject<void>();
    const flushesProfile$ = new Subject<void>();

    let client: NostrClient | null = null;
    let timelineSub: any = null;
    let profileSub: any = null;

    onMount(() => {
        client = getNostrClient();

        // タイムライン購読
        timelineSub = client.rx_nostr.use(rxReqTimeline)
            .pipe(uniq(flushesTimeline$))
            .subscribe({
            next: ({ event }) => {
                if (event.kind !== 1) return;

                if (!(event.pubkey in profiles)) {
                    rxReqProfile.emit({
                        kinds: [0],
                        authors: [event.pubkey],
                        limit: 1,
                    });
                }

                nostrEvent = {
                    id: event.id,
                    pubkey: event.pubkey,
                    kind: event.kind,
                    created_at: event.created_at,
                    tags: event.tags,
                    content: event.content,
                };

                const refId = event.tags.filter((tag) => tag[0] === 'e');
                const refPubkey = event.tags.filter((tag) => tag[0] === 'p');

                if (refId.length !== 0 && refPubkey.length !== 0) {
                    nostrRef = {
                        id: refId[0][1],
                        pubkey: refPubkey[0][1],
                    };
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

                    profiles = {...profiles, [event.pubkey]: profile};

                    const npubResult = profile.about?.match(/nostr:[a-z0-9]+/g);
                    const pubkeys = npubResult?.map((npub) => decodeNostrURI(npub))
                        .filter((pdata) => pdata.type === 'npub')
                        .map((pdata) => pdata.data);
                    if (pubkeys) {
                        rxReqProfile.emit({
                            kinds: [0],
                            authors: pubkeys,
                            limit: pubkeys.length,
                        });
                    }
                } catch (e) {
                    console.warn('Failed to parse profile metadata', e);
                }
            },
            error: (err) => {
                console.error(err);
            },
        });
        flushesProfile$.next();

        return () => {
            timelineSub.unsubscribe();
            profileSub.unsubscribe();
        };
    });

    $effect(() => {
        if (!client) return;

        if (data.result.type === 'nevent') {
            kind = 'nevent';
            nostrEvent = null;
            nostrRef = null;
            profiles = {};
            pubkey = null;
            rxReqTimeline.emit({
                kinds: [1],
                ids: [data.result.data.id],
                limit: 1,
            });
        } else if (data.result.type === 'note') {
            kind = 'note';
            nostrEvent = null;
            nostrRef = null;
            profiles = {};
            pubkey = null;
            rxReqTimeline.emit({
                kinds: [1],
                ids: [data.result.data],
                limit: 1,
            });
        } else if (data.result.type === 'npub') {
            kind = 'npub';
            nostrEvent = null;
            nostrRef = null;
            profiles = {};
            pubkey = data.result.data;
            rxReqProfile.emit({
                kinds: [0],
                authors: [data.result.data],
                limit: 1,
            });
        } else {
            kind = null;
            nostrEvent = null;
            nostrRef = null;
            profiles = {};
            pubkey = null;
        }
    });

    function goBack(event: MouseEvent) {
        event.preventDefault();
        history.back();
    }
</script>

<div class="navigation">
    <a href="/" class="underline" onclick={goBack}>← Back</a>
</div>

{#if kind === 'nevent' && nostrEvent}
    <Post event={nostrEvent!!} profiles={profiles} nostr_ref={nostrRef} />
{:else if kind === 'note' && nostrEvent}
    <Post event={nostrEvent!!} profiles={profiles} nostr_ref={nostrRef} />
{:else if kind === 'npub' && pubkey}
    <Profile pubkey={pubkey} profiles={profiles} />
{/if}
