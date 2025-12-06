<script lang="ts">
    import DOMPurify from "isomorphic-dompurify";

    // イベントID
    export let id: string = '';
    // 公開鍵
    export let pubkey: string = '';
    // イベント作成日
    export let createdAt: number = 0;
    // イベント内容
    export let content: string = '';
    // ユーザ表示名
    export let userDisplayName: string | undefined = undefined;
    // ユーザ名
    export let userName: string | undefined = undefined;

    // 整数で表現された日時を表示用に整形する
    function formatTime(ts: number) {
        return new Date(ts * 1000).toLocaleString();
    }

    // イベント内容を表示用に整形する
    function formatContent(content: string) {
        return DOMPurify.sanitize(content)
            .replace(/(http[^\s]+)/g, '<a href="$1" target="_blank" class="underline">$1</a>')
            .replaceAll('\n', '<br>\n');
    }
</script>

<div id={id} class="post border-gray-500 border rounded-md p-2 mt-2">
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
        
        <span class="user-name text-gray-500 grow shrink min-w-0 whitespace-nowrap overflow-hidden mr-1">
            {#if userDisplayName && userName && userDisplayName!==userName}
                @{userName}
            {/if}
        </span>

        <span class="post-created-at text-gray-500 grow-0 shrink-0 basis-auto wrap-break-word">{formatTime(createdAt)}</span>
    </div>

    <div class="post-content">{@html formatContent(content)}</div>
</div>
