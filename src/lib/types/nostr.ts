export type NostrState = {
    events: NostrEvent[],
    eventsById: Record<string, NostrEvent>,
    profiles: Record<string, NostrProfile>,
};

export type NostrEvent = {
    id: string;
    pubkey: string;
    kind: number;
    created_at: number;
    tags: string[][];
    content: string;
    reference?: NostrRef;
    repost_id?: string;
};

export type NostrProfile = {
    pubkey: string;
    name?: string,
    display_name?: string,
    picture?: string;
    about?: string;
    tags: string[][];
};

export type NostrRef = {
    id: string;
    pubkey: string;
};
