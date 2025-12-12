export type NostrState = {
    events: NostrEvent[],
    eventsById: Record<string, NostrEvent>,
    eventsByAddr: Record<string, NostrEvent>,
    profiles: Record<string, NostrProfile>,
    notifications: NostrEvent[],
    relays: NostrRelay[],
    followees: string[],
};

export type NostrEvent = {
    id: string;
    pubkey: string;
    kind: number;
    created_at: number;
    tags: string[][];
    content: string;
};

export type NostrProfile = {
    pubkey: string;
    name?: string,
    display_name?: string,
    picture?: string;
    about?: string;
    tags: string[][];
    created_at: number;
};

export type NotifyType = 'all' | 'mentions' | 'reposts' | 'reactions';

export type NostrRelay = {
    url: string;
    read: boolean;
    write: boolean;
};
