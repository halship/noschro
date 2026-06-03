import { browser } from '$app/environment';

// 設定値を取得
export function getSetting(key: string): string | null {
	if (browser) {
		return localStorage.getItem(key);
	}
	return null;
}

// 設定を保存
export function setSetting(key: string, value: string) {
	if (browser) {
		localStorage.setItem(key, value);
	}
}

// 設定を削除
export function removeSetting(key: string) {
	if (browser) {
		localStorage.removeItem(key);
	}
}
