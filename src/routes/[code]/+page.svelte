<script lang="ts">
	import type { NostrClient, NostrEvent, NostrProfile, NostrRef } from '$lib/types/nostr';
    import { getNostrClient } from '$lib/types/nostr';
    import Post from '$lib/Post.svelte';
	import { onMount } from 'svelte';
	import { createRxForwardReq } from 'rx-nostr';
	import Profile from '$lib/Profile.svelte';

	let { data } = $props();

    let kind: string | null = $state(null);
    let nostrEvent: NostrEvent | null = $state(null);
    let profile: NostrProfile | null = $state(null);
    let nostrRef: NostrRef | null = $state(null);

    const rxReqTimeline = createRxForwardReq();
    const rxReqProfile = createRxForwardReq();

    let client: NostrClient | null = null;
    let timelineSub: any = null;
    let profileSub: any = null;

    onMount(() => {
        client = getNostrClient();

        // タイムライン購読
        timelineSub = client.rx_nostr.use(rxReqTimeline).subscribe({
            next: ({ event }) => {
                if (event.kind !== 1) return;

                if (!profile) {
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

        // プロフィール購読
        profileSub = client.rx_nostr.use(rxReqProfile).subscribe({
            next: ({ event }) => {
                if (event.kind !== 0) return;

                try {
                    const meta = JSON.parse(event.content) as {
                        name?: string;
                        display_name?: string;
                        picture?: string;
                        about?: string;
                    };

                    profile = {
                        pubkey: event.pubkey,
                        name: meta.name,
                        display_name: meta.display_name,
                        picture: meta.picture,
                        about: meta.about,
                    };
                } catch (e) {
                    console.warn('Failed to parse profile metadata', e);
                }
            },
            error: (err) => {
                console.error(err);
            },
        });

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
            profile = null;
            nostrRef = null;
            rxReqTimeline.emit({
                kinds: [1],
                ids: [data.result.data.id],
                limit: 1,
            });
        } else if (data.result.type === 'npub') {
            kind = 'npub';
            nostrEvent = null;
            profile = null;
            nostrRef = null;
            rxReqProfile.emit({
                kinds: [0],
                authors: [data.result.data],
                limit: 1,
            });
        } else {
            kind = null;
            nostrEvent = null;
            profile = null;
            nostrRef = null;
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
    <Post event={nostrEvent!!} profile={profile} nostr_ref={nostrRef} />
{:else if kind === 'npub' && profile}
    <Profile profile={profile!!} />
{/if}
