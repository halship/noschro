<script lang="ts">
	import type { NostrProfile } from '$lib/types/nostr';
	import { formatContent, formatDisplayName, getLoadImage } from '$lib/util';

	export let profiles: Record<string, NostrProfile>;
	export let pubkey: string;
</script>

<div class="profile border-thin border rounded-md mt-2 overflow-hidden">
	{#if getLoadImage()}
		<div class="relative h-[230px] w-full bg-thin">
			{#if profiles[pubkey]?.banner}
				<img
					src={profiles[pubkey]?.banner}
					alt="banner"
					class="h-[230px] w-full object-cover object-center"
				/>
			{/if}

			{#if profiles[pubkey]?.picture}
				<img
					src={profiles[pubkey]?.picture}
					alt="pictures"
					class="rounded-full w-[120px] border-2 border-light absolute left-2 bottom-2"
				/>
			{/if}
		</div>
	{/if}

	<div class="p-2">
		<div class="user-display-name font-bold text-lg wrap-break-word">
			{#if profiles[pubkey]?.display_name}
				{@html formatDisplayName(profiles[pubkey].display_name!, profiles[pubkey].tags)}
			{:else if profiles[pubkey]?.name}
				@{profiles[pubkey].name}
			{/if}
		</div>

		{#if profiles[pubkey]?.display_name && profiles[pubkey].name}
			<div class="user-name text-thin wrap-break-word">@{profiles[pubkey].name}</div>
		{/if}

		<div class="user-about mt-5 wrap-break-word">
			{@html formatContent(profiles[pubkey].about ?? '', profiles[pubkey].tags)}
		</div>
	</div>
</div>
