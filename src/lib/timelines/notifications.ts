import { kindGeneralRepost, kindMetaData, kindPost, kindReaction, kindRepost, kindsEvent, loadLimit, maxTimelineNum } from "$lib/consts";
import { pubkey } from "$lib/signer";
import { nostrState } from "$lib/state.svelte";
import type { NostrEvent, NotifyType } from "$lib/types/nostr";
import { createRxBackwardReq, now, uniq, type LazyFilter } from "rx-nostr";
import { Subject, type Subscription } from "rxjs";
import { rxNostr, rxReqProfiles } from "./base_timeline";

export const rxReqOldNotifications = createRxBackwardReq();
export let oldNotificationsSub: Subscription | undefined = undefined;
export let flushesNotifications$ = new Subject<void>();

export function subscribeNotifications() {
    // 古い通知を取得
    oldNotificationsSub = rxNostr?.use(rxReqOldNotifications)
        .pipe(uniq(flushesNotifications$))
        .subscribe({
            next: ({ event }) => {
                const nostrEvent: NostrEvent = { ...event };
                const index = nostrState.notifications
                    .findIndex((ev) => ev.created_at < event.created_at);
                if (index < 0) {
                    nostrState.notifications = [...nostrState.notifications, nostrEvent]
                        .slice(0, nostrState.timelineNum);
                } else {
                    nostrState.notifications = nostrState.notifications
                        .toSpliced(index, 0, nostrEvent)
                        .slice(0, nostrState.timelineNum);
                }

                if (!(event.pubkey in nostrState.profiles)) {
                    rxReqProfiles.emit({
                        kinds: [kindMetaData],
                        authors: [event.pubkey],
                        limit: 1,
                    });
                }
            },
            error: (err) => {
                console.error(err);
            }
        });

    nostrState.notifications = [];
    flushesNotifications$.next();
    rxReqOldNotifications.emit(getNotificationsFilter('all'));
}

export function unsubscribeNotifications() {
    nostrState.notifications = [];
    oldNotificationsSub?.unsubscribe();
    flushesNotifications$.next();
}

export function getNotificationsFilter(notifyType: NotifyType): LazyFilter {
    const until = nostrState.notifications.length > 0 ? nostrState.notifications.slice(-1)[0].created_at : now();
    const limit = maxTimelineNum - nostrState.notifications.length < loadLimit ? maxTimelineNum - nostrState.notifications.length : loadLimit;

    if (notifyType === 'mentions') {
        return {
            kinds: [kindPost],
            '#p': [pubkey!],
            until,
            limit,
        };
    } else if (notifyType === 'reactions') {
        return {
            kinds: [kindReaction],
            '#p': [pubkey!],
            until,
            limit,
        };
    } else if (notifyType === 'reposts') {
        return {
            kinds: [kindRepost, kindGeneralRepost],
            '#p': [pubkey!],
            until,
            limit,
        };
    } else {
        return {
            kinds: [...kindsEvent, kindReaction],
            '#p': [pubkey!],
            until,
            limit,
        };
    }
}
