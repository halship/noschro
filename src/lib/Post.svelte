<script lang="ts">
    import DOMPurify from "isomorphic-dompurify";

    // イベントID
    export let id: string;
    // 公開鍵
    export let pubkey: string;
    // イベント作成日
    export let createdAt: number;
    // イベント内容
    export let content: string;
    // ユーザ表示名
    export let userDisplayName: string | undefined;
    // ユーザ名
    export let userName: string | undefined;

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
            } else {
                // その他の場合
                result.push(content.slice(i).charAt(0));
                i++;
            }
        }

        return result.join('');
    }
</script>

<div id={id} class="post border-thin border rounded-md p-2 mt-2">
    <div class="post-header mb-1 flex">
        <span class="user-display-name font-bold grow-0 shrink basis-auto min-w-0 whitespace-nowrap overflow-hidden mr-1">
            {#if userDisplayName}
                {userDisplayName}
            {:else if userName}
                {userName}
            {:else}
                {pubkey.substring(0, 9)}
            {/if}
        </span>
        
        <span class="user-name text-thin grow shrink min-w-0 whitespace-nowrap overflow-hidden mr-1">
            {#if userDisplayName && userName && userDisplayName!==userName}
                @{userName}
            {/if}
        </span>

        <span class="post-created-at text-thin grow-0 shrink-0 basis-auto">{formatTime(createdAt)}</span>
    </div>

    <div class="post-content wrap-break-word">{@html formatContent(content)}</div>
</div>
