export interface Token { }

export class Text implements Token {
    public value: string;

    public constructor(value: string) {
        this.value = value;
    }
}

export class Image implements Token {
    public url: string;

    public constructor(url: string) {
        this.url = url;
    }
}

export class Video implements Token {
    public url: string;

    public constructor(url: string) {
        this.url = url;
    }
}

export class Link implements Token {
    public url: string;

    public constructor(url: string) {
        this.url = url;
    }
}

export class Reference implements Token {
    public code: string;
    public id: string;

    public constructor(code: string, id: string) {
        this.code = code;
        this.id = id;
    }
}

export class LongContent implements Token {
    public code: string;

    public constructor(code: string) {
        this.code = code;
    }
}

export class User implements Token {
    public code: string;
    public pubkey: string;

    public constructor(code: string, pubkey: string) {
        this.code = code;
        this.pubkey = pubkey;
    }
}

export class Emoji implements Token {
    public code: string;

    public constructor(code: string) {
        this.code = code;
    }
}

export class Br implements Token {
    public constructor() { }
}

export class Space implements Token {
    public constructor() { }
}