import { onMount } from 'svelte';
import { initNostr, type Client } from '$lib/client';
import { subscribeEvents, unsubscribeEvents } from './events';
import { subscribeProfiles, unsubscribeProfiles } from './profiles';
import { subscribeTimeline, unsubscribeTimeline } from './timeline';

type SubscriptionType = 'events' | 'profiles' | 'timeline';

type Options = {
	onReady?: (client: Client) => void | Promise<void>;
};

export function useNostrSubscriptions(subscriptions: SubscriptionType[], options: Options = {}) {
	onMount(() => {
		let disposed = false;

		initNostr().then(async (client) => {
			if (disposed) return;

			for (const subscription of subscriptions) {
				subscribe(subscription, client);
			}

			await options.onReady?.(client);
		});

		return () => {
			disposed = true;

			for (const subscription of subscriptions.toReversed()) {
				unsubscribe(subscription);
			}
		};
	});
}

function subscribe(subscription: SubscriptionType, client: Client) {
	if (subscription === 'events') {
		subscribeEvents(client);
	} else if (subscription === 'profiles') {
		subscribeProfiles(client);
	} else if (subscription === 'timeline') {
		subscribeTimeline(client);
	}
}

function unsubscribe(subscription: SubscriptionType) {
	if (subscription === 'events') {
		unsubscribeEvents();
	} else if (subscription === 'profiles') {
		unsubscribeProfiles();
	} else if (subscription === 'timeline') {
		unsubscribeTimeline();
	}
}
