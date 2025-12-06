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
        <div class="user-display-name">
            {#if userDisplayName}
                {userDisplayName}
            {:else if userName}
                {userName}
            {:else}
                {pubkey}
            {/if}
        </div>
        <div class="user-name">
            {#if userDisplayName && userName}
                @{userName}
            {/if}
        </div>

        <div class="post-created-at">{formatTime(createdAt)}</div>
    </div>

    <div class="post-content">{@html formatContent(content)}</div>
</div>

<style>
    .post {
        border: 1px solid #aaaaaa;
        border-radius: 8px;
        padding: 0.5em;
        margin-top: 1em;
        overflow-wrap: break-word;
    }

    .post-header {
        margin-bottom: 0.5em;
        display: grid;
        grid-template-columns: auto 1fr auto;
    }

    .user-display-name {
        font-weight: bold;
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        margin-right: 0.5em;
    }

    .user-name {
        color: #aaaaaa;
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        margin-right: 0.5em;
    }

    .post-created-at {
        color: #aaaaaa;
        text-align: right;
    }
</style>
