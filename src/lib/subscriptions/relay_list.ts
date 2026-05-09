import type { NostrRelay } from '$lib/nostr_type';
import { createRxBackwardReq, latest, type RxNostr } from 'rx-nostr';
import { firstValueFrom } from 'rxjs';

export async function fetchRelayList(rxNostr: RxNostr, pubkey: string): Promise<NostrRelay[]> {
	const rxReq = createRxBackwardReq();
	const packetPromise = firstValueFrom(rxNostr.use(rxReq).pipe(latest()));

	rxReq.emit({
		kinds: [10002],
		authors: [pubkey],
		limit: 1
	});

	const packet = await packetPromise;
	const relays = packet.event.tags
		.filter((tag) => tag[0] === 'r')
		.map((tag) => {
			return {
				url: tag[1],
				read: tag[2] ? tag[2] === 'read' : true,
				write: tag[2] ? tag[2] === 'write' : true
			};
		});

	return relays;
}
