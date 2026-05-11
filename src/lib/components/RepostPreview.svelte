<script lang="ts">
	import type { Profile } from '$lib/models/profile';
	import { Repeat } from '@lucide/svelte';
	import UserName from './UserName.svelte';

	type Props = {
		pubkey: string;
		profile?: Profile;
	};

	let { pubkey, profile }: Props = $props();
</script>

<div class="px-2 pt-1">
	<Repeat class="inline-block size-4 text-green-600" />
	<span>
		<UserName {pubkey} {profile} />
	</span>
</div>
