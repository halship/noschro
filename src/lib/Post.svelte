<script lang="ts">
    import DOMPurify from "isomorphic-dompurify";
	import type { NostrEvent, NostrProfile } from "$lib/types/nostr";
	import { neventEncode } from "nostr-tools/nip19";

    export let event: NostrEvent;
    export let profiles: Record<string, NostrProfile>;

    // 整数で表現された日時を表示用に整形する
    function formatTime(ts: number) {
        return new Date(ts * 1000).toLocaleString();
    }

    // イベント内容を表示用に整形する
    function formatContent(content: string) {
        content = DOMPurify.sanitize(content);

        const result: string[] = [];
        let i: number = 0

        while (i < content.length) {
            const urlResult = content.slice(i).match(/^https?:\/\/([\w!?/+\-=_~;.,*&@#$%()'[\]]+)/);
            const codeResult = content.slice(i).match(/^nostr:[a-z0-9]+/);
            
            if (urlResult) {
                // URL文字列の場合
                const url: string = urlResult[0];
                const urlBase: string = urlResult[1];
                const imgResult = url.match(/^.+\.(jpg|jpeg|gif|png|webp|mp4)/i);

                if (imgResult) {
                    const imgType = imgResult[1].toLowerCase();
                    // 画像の場合
                    result.push('<a href="');
                    result.push(url);
                    result.push('" target="_blank" class="underline">');
                    result.push('[Open media (type: ' + imgType + ')]');
                    result.push('</a>');
                    
                    i += url.length;
                } else {
                    // 外部リンクの場合
                    result.push('<a href="');
                    result.push(url);
                    result.push('" target="_blank" class="underline">');

                    if (urlBase.length > 100) {
                        result.push(urlBase.slice(0, 100 - 3));
                        result.push('...');
                    } else {
                        result.push(urlBase);
                    }

                    result.push('</a>');
                    
                    i += url.length;
                }
            } else if (content.slice(i).startsWith('\n')) {
                // 改行の場合
                result.push('<br>');
                i++;
            } else if (codeResult) {
                const code = codeResult[0].slice(6);

                if (code.startsWith('nevent')) {
                    result.push('<a href="/');
                    result.push(code);
                    result.push('" class="underline">[引用]</a>');
                } else {
                    result.push(codeResult[0]);
                }

                i += codeResult[0].length;
            } else {
                // その他の場合
                result.push(content.slice(i).charAt(0));
                i++;
            }
        }

        return result.join('');
    }

    function getEventCode(ev: NostrEvent): string {
        return neventEncode({
            id: ev.id,
            author: ev.pubkey,
        });
    }
</script>

<div id={event.id} class="post border-thin border rounded-md p-2 mt-2">
    <div class="post-header mb-1 flex">
        <span class="user-display-name font-bold grow-0 shrink basis-auto min-w-0 whitespace-nowrap overflow-hidden mr-1">
            {#if profiles[event.pubkey]?.display_name}
                {profiles[event.pubkey]?.display_name}
            {:else if profiles[event.pubkey]?.name}
                {profiles[event.pubkey]?.name}
            {:else}
                {event.pubkey.substring(0, 9)}
            {/if}
        </span>
        
        <span class="user-name text-thin grow shrink min-w-0 whitespace-nowrap overflow-hidden mr-1">
            {#if profiles[event.pubkey]?.display_name && profiles[event.pubkey]?.name && profiles[event.pubkey]?.display_name!==profiles[event.pubkey]?.name}
                @{profiles[event.pubkey]?.name}
            {/if}
        </span>

        <span class="post-created-at text-thin grow-0 shrink-0 basis-auto"><a href="/{getEventCode(event)}" class="underline">{formatTime(event.created_at)}</a></span>
    </div>

    <div class="post-content wrap-break-word">{@html formatContent(event.content)}</div>
</div>
