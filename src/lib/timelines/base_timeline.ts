import { batch, createRxBackwardReq, createRxForwardReq, createRxNostr, latest, uniq, type RxNostr } from "rx-nostr";
import { verifier } from "@rx-nostr/crypto";
import { defaultRelays, kindFollowList, kindMetaData, kindRelayList, kindUserStatus, loadBufferTime } from "$lib/consts";
import { bufferTime, Subject, type Subscription } from "rxjs";
import { nostrState } from "$lib/state.svelte";
import { signer, pubkey } from "$lib/signer";
import type { NostrEvent, NostrProfile, NostrRelay, UserStatus } from "$lib/types/nostr";
import { getAddr } from "$lib/util";
import { flushesTimeline$, unsubscribeHome } from "./home_timeline";
import { flushesNotifications$ } from "./notifications";

export const rxReqRelays = createRxBackwardReq();
export const rxReqFollow = createRxBackwardReq();
export const rxReqProfiles = createRxForwardReq();
export const rxReqEvent = createRxBackwardReq();
export const rxReqUserStates = createRxBackwardReq();

export let flushesProfiles$ = new Subject<void>();

export let rxNostr: RxNostr | null = null;

let profilesSub: Subscription | null = null;
let eventSub: Subscription | null = null;
let oldNotificationsSub: Subscription | null = null;
let userStatesSub: Subscription | null = null;

export async function subscribeBase() {
    if (signer === null || pubkey === null) {
        throw Error('signer or pubkey is null');
    }

    if (rxNostr !== null) return;

    rxNostr = createRxNostr({
        verifier,
        signer,
        connectionStrategy: 'lazy-keep',
    });
    rxNostr.setDefaultRelays(defaultRelays);

    // プロフィール取得
    const rxReqProfilesBatched = rxReqProfiles
        .pipe(bufferTime(loadBufferTime), batch());
    profilesSub = rxNostr.use(rxReqProfilesBatched)
        .pipe(uniq(flushesProfiles$))
        .subscribe({
            next: ({ event }) => {
                if ((event.pubkey in nostrState.profiles) &&
                    nostrState.profiles[event.pubkey].created_at > event.created_at) {
                    return;
                }

                try {
                    const meta = JSON.parse(event.content) as {
                        name?: string;
                        display_name?: string;
                        picture?: string;
                        banner?: string;
                        about?: string;
                    };

                    const profile: NostrProfile = {
                        pubkey: event.pubkey,
                        tags: event.tags,
                        created_at: event.created_at,
                        name: meta.name,
                        display_name: meta.display_name,
                        picture: meta.picture,
                        banner: meta.banner,
                        about: meta.about,
                    };

                    nostrState.profiles = { ...nostrState.profiles, [event.pubkey]: profile };

                    rxReqUserStates.emit({
                        kinds: [kindUserStatus],
                        authors: [event.pubkey],
                        limit: 1,
                    });
                } catch (err) {
                    console.error('Failed to parse profile metadata');
                }
            }
        });

    // イベント取得
    const rxReqEventBatched = rxReqEvent.pipe(bufferTime(loadBufferTime), batch());
    eventSub = rxNostr.use(rxReqEventBatched)
        .pipe(uniq(flushesTimeline$))
        .subscribe({
            next: ({ event }) => {
                if (event.id in nostrState.eventsById) {
                    return;
                }

                const nostrEvent: NostrEvent = { ...event };
                nostrState.eventsById = { ...nostrState.eventsById, [event.id]: nostrEvent };

                if (!(event.pubkey in nostrState.profiles)) {
                    rxReqProfiles.emit({
                        kinds: [kindMetaData],
                        authors: [event.pubkey],
                        limit: 1,
                    });
                }

                const identifiers = event.tags.filter((t) => t[0] === 'd')
                    .map((t) => t[1]);
                if (identifiers.length > 0) {
                    const key = getAddr(event.kind, event.pubkey, identifiers[0]);
                    nostrState.eventsByAddr = { ...nostrState.eventsByAddr, [key]: nostrEvent };
                }
            },
            error: (err) => {
                console.error(err);
            }
        });

    // ユーザのステータスを取得
    const rxReqUserStatesBatched = rxReqUserStates.pipe(bufferTime(loadBufferTime), batch());
    userStatesSub = rxNostr.use(rxReqUserStatesBatched)
        .pipe(uniq(flushesProfiles$))
        .subscribe({
            next: ({ event }) => {
                if ((event.pubkey in nostrState.userGeneralStatuses) &&
                    nostrState.userGeneralStatuses[event.pubkey].created_at > event.created_at) {
                    return;
                }

                const kind = event.tags.filter((t) => t[0] === 'd')
                    .map((t) => t[1])
                    .at(0);
                const userStatus: UserStatus = {
                    pubkey: event.pubkey,
                    content: event.content,
                    tags: event.tags,
                    created_at: event.created_at,
                };
                if (kind === 'general' && event.content.trim().length > 0) {
                    nostrState.userGeneralStatuses = { ...nostrState.userGeneralStatuses, [event.pubkey]: userStatus };
                } else if (kind === 'music' && event.content.trim().length > 0) {
                    nostrState.userMusicStatuses = { ...nostrState.userMusicStatuses, [event.pubkey]: userStatus };
                }
            },
            error: (err) => {
                console.error(err);
            }
        });

    nostrState.relays = await getRelays();
    rxNostr.setDefaultRelays(nostrState.relays);
    nostrState.followees = await getFollowees();
}

export function closeNostr() {
    unsubscribeHome();
    profilesSub?.unsubscribe();
    profilesSub = null;
    eventSub?.unsubscribe();
    eventSub = null;
    oldNotificationsSub?.unsubscribe();
    oldNotificationsSub = null;
    userStatesSub?.unsubscribe();
    userStatesSub = null;

    flushesTimeline$.next();
    flushesProfiles$.next();
    flushesNotifications$.next();

    rxNostr?.dispose();
    rxNostr = null;
}

export function getRelays(): Promise<NostrRelay[]> {
    return new Promise((resolve) => {
        const relaysSub = rxNostr!.use(rxReqRelays)
            .pipe(latest())
            .subscribe({
                next: ({ event }) => {
                    const relays = event.tags.filter((t) => t[0] === 'r')
                        .map((t) => {
                            if (t.length < 3) {
                                return { url: t[1], read: true, write: true };
                            } else if (t[2] === 'read') {
                                return { url: t[1], read: true, write: false };
                            } else {
                                return { url: t[1], read: false, write: true };
                            }
                        });

                    console.log(`[${kindRelayList}] Set default relays`);
                    for (const relay of relays) {
                        console.log(relay.url);
                    }

                    relaysSub.unsubscribe();
                    resolve(relays);
                },
                error: (err) => {
                    console.error(err);
                }
            });

        rxReqRelays.emit({
            kinds: [kindRelayList],
            authors: [pubkey!],
            limit: 1,
        });
    });
}

export function getFollowees(): Promise<string[]> {
    return new Promise((resolve) => {
        const followSub = rxNostr!.use(rxReqFollow)
            .pipe(latest())
            .subscribe({
                next: ({ event }) => {
                    const followees = event.tags.filter((t) => t[0] === 'p')
                        .map((t) => t[1]);

                    console.log(`[${kindFollowList}] Set follow list`);

                    followSub.unsubscribe();
                    resolve(followees);
                },
                error: (err) => {
                    console.error(err);
                }
            });

        rxReqFollow.emit({
            kinds: [kindFollowList],
            authors: [pubkey!],
            limit: 1,
        });
    });
}
