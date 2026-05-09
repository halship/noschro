import { createRxBackwardReq, latest, type RxNostr } from 'rx-nostr';
import { firstValueFrom } from 'rxjs';

export async function fetchFollowList(rxNostr: RxNostr, pubkey: string): Promise<string[]> {
	const rxReq = createRxBackwardReq();
	const packetPromise = firstValueFrom(rxNostr.use(rxReq).pipe(latest()));

	rxReq.emit({
		kinds: [3],
		authors: [pubkey],
		limit: 1
	});

	const packet = await packetPromise;
	const followees = packet.event.tags.filter((tag) => tag[0] === 'p').map((tag) => tag[1]);

	return followees;
}
