export type NostrState = {
    events: NostrEvent[],
    eventsById: Record<string, NostrEvent>,
    nostrRefs: Record<string, NostrRef>,
    profiles: Record<string, NostrProfile>,
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
};

export type NostrRef = {
    id: string;
    pubkey: string;
};
