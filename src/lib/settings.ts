import { browser } from '$app/environment';

type SettingsKey = 'theme' | 'login';

export function getSetting(key: SettingsKey): string | null {
	return browser ? localStorage.getItem(key) : null;
}

export function setSetting(key: SettingsKey, value: string) {
	if (browser) {
		localStorage.setItem(key, value);
	}
}
