<script lang="ts">
	import type { NostrEvent, NostrProfile } from '$lib/types/nostr';
    import Post from '$lib/Post.svelte';
    import { verifier } from "@rx-nostr/crypto";
	import { onMount } from 'svelte';
	import { createRxForwardReq, createRxNostr } from 'rx-nostr';

	let { data } = $props();

    let kind: string | null = $state(null);
    let events: NostrEvent[] = $state([]);
    let profiles: Record<string, NostrProfile> = $state({});

    onMount(() => {
        const defaultRelays = ['wss://yabu.me'];
        const rxNostr = createRxNostr({ verifier });
        rxNostr.setDefaultRelays(defaultRelays);

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

                const nostrEvent: NostrEvent = {
                    id: event.id,
                    pubkey: event.pubkey,
                    kind: event.kind,
                    created_at: event.created_at,
                    tags: event.tags,
                    content: event.content,
                };

                events = [nostrEvent, ...events];
            },
            error: (err) => {
                console.error(err);
            },
        });

        // プロフィール購読
        const profileSub = rxNostr.use(rxReqProfile).subscribe({
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

        if (data.result.type === 'nevent') {
            kind = 'nevent';
            rxReqTimeline.emit({
                kinds: [1],
                ids: [data.result.data.id],
                limit: 1,
            });
        }

        return () => {
            timelineSub.unsubscribe();
            profileSub.unsubscribe();
        };
    });
</script>

<div class="navigation">
    <a href="/" class="underline">← Back</a>
</div>

{#if kind === 'nevent'}
    <div id="posts">
        {#each events as ev (ev.id)}
            <Post event={ev} profiles={profiles} />
        {/each}
    </div>
{/if}
