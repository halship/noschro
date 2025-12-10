export type NostrState = {
    authoricated: boolean,
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
    created_at: number;
};

export type NotifyType = 'all' | 'mentions' | 'reposts' | 'reactions';
