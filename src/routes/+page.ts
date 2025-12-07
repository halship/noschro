import type { PageLoad } from "./$types";

export const load: PageLoad = ({ params }) => {
    return {
        title: 'ホーム',
        default_relays: ['wss://yabu.me'],
    };
}