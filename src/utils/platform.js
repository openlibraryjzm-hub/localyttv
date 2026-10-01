/**
 * Platform Detection Utility
 * Determines if the app is running as a desktop app (Tauri / WebView2) or on the Web (localyt.tv).
 */

export const isTauri = () => typeof window !== 'undefined' && !!(window.__TAURI_INTERNALS__ || window.__TAURI__);

export const isWebView2 = () => typeof window !== 'undefined' && !!(window.chrome && window.chrome.webview);

export const isWeb = () => !isTauri() && !isWebView2();
