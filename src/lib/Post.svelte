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
            .replace(/(http[^\s]+)/g, '<a href="$1" target="_blank">$1</a>')
            .replaceAll('\n', '<br>\n');
    }
</script>

<div id={id} class="post">
    <div class="post-header">
        <span class="user-display-name">
            {#if userDisplayName}
                {userDisplayName}
            {:else if userName}
                {userName}
            {:else}
                {pubkey.substring(0, 9)}
            {/if}
        </span>
        
        <span class="user-name">
            {#if userDisplayName && userName && userDisplayName!==userName}
                @{userName}
            {/if}
        </span>

        <span class="post-created-at">{formatTime(createdAt)}</span>
    </div>

    <div class="post-content">{@html formatContent(content)}</div>
</div>

<style>
    .post {
        border: 1px solid #aaaaaa;
        border-radius: 8px;
        padding: 0.5em;
        margin-top: 1em;
    }

    .post-header {
        margin-bottom: 0.5em;
        display: flex;
    }

    .user-display-name {
        font-weight: bold;
        flex: 0 1 auto;
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        margin-right: 0.5em;
    }

    .user-name {
        color: #aaaaaa;
        flex: 1 1;
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        margin-right: 0.5em;
    }

    .post-created-at {
        color: #aaaaaa;
        flex: 0 0 auto;
        text-align: right;
    }

    .post-content {
        overflow-wrap: break-word;
    }
</style>
