<script lang="ts">
	import { pubkeyToColor } from '$lib/formatter';
	import { User } from '@lucide/svelte';

	type Props = {
		pubkey: string;
		picture?: string;
		alt?: string;
		class?: string;
	};

	let { pubkey, picture, alt = 'User picture', class: className }: Props = $props();

	let iconColor = $derived(pubkeyToColor(pubkey));
</script>

{#if picture}
	<img src={picture} aria-hidden="true" {alt} class={className} />
{:else}
	<div class={className} style:background-color={iconColor}>
		<User class="text-app-text size-full rounded-full" />
	</div>
{/if}
