export type NostrState = {
    authoricated: boolean,
    tlLoading: boolean,
    events: NostrEvent[],
    eventsById: Record<string, NostrEvent>,
    profiles: Record<string, NostrProfile>,
    notifications: NostrEvent[],
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
};

export type NotifyType = 'all' | 'mentions' | 'reposts' | 'reactions';
