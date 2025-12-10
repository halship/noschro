export type NostrState = {
    authoricated: boolean,
    tlLoading: boolean,
    pubkey: string | null,
    events: NostrEvent[],
    eventsById: Record<string, NostrEvent>,
    profiles: Record<string, NostrProfile>,
    notifications: NostrEvent[],
    pendingEvents: string[],
    pendingProfiles: string[],
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
