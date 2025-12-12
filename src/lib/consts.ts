export const maxTimelineNum = 1000;
export const loadLimit = 10;
export const loadBufferTime = 1000;
export const defaultRelays = [
    'wss://relay.nostr.band/',
    'wss://nos.lol/',
    'wss://relay.damus.io/',
    'wss://yabu.me',
];

export const kindMetaData = 0;
export const kindPost = 1;
export const kindFollowList = 3;
export const kindDelete = 5;
export const kindRepost = 6;
export const kindReaction = 7;
export const kindGeneralRepost = 16;
export const kindRelayList = 10002;

export const kindsEvent = [kindPost, kindDelete, kindRepost, kindGeneralRepost];