<script lang="ts">
    import DOMPurify from "isomorphic-dompurify";
	import type { NostrProfile } from "./types/nostr";

    export let profile: NostrProfile;

    function formatAbout(about: string | undefined): string {
        if (!about) return '';
        return DOMPurify.sanitize(about).replaceAll('\n', '<br>');
    }
</script>

<div class="profile border-thin border rounded-md p-2 mt-2">
    <div class="user-display-name font-bold text-lg wrap-break-word">{profile.display_name}</div>
    <div class="user-name text-thin wrap-break-word">@{profile.name}</div>
    <div class="user-about mt-5 wrap-break-word">{@html formatAbout(profile.about)}</div>
</div>