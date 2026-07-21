import * as Linking from "expo-linking";
import * as ReactNative from "react-native";

const bundleId = "space.manus.virellestudios.mobile.t20260317065920";
const timestamp = bundleId.split(".").pop()?.replace(/^t/, "") ?? "";
const schemeFromBundleId = `manus${timestamp}`;

const env = {
  portal: process.env.EXPO_PUBLIC_OAUTH_PORTAL_URL ?? "",
  server: process.env.EXPO_PUBLIC_OAUTH_SERVER_URL ?? "",
  appId: process.env.EXPO_PUBLIC_APP_ID ?? "",
  ownerId: process.env.EXPO_PUBLIC_OWNER_OPEN_ID ?? "",
  ownerName: process.env.EXPO_PUBLIC_OWNER_NAME ?? "",
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "",
  webAppBaseUrl: process.env.EXPO_PUBLIC_WEB_APP_BASE_URL ?? "https://virelle.life",
  deepLinkScheme: schemeFromBundleId,
};

export const OAUTH_PORTAL_URL = env.portal;
export const OAUTH_SERVER_URL = env.server;
export const APP_ID = env.appId;
export const OWNER_OPEN_ID = env.ownerId;
export const OWNER_NAME = env.ownerName;
export const API_BASE_URL = env.apiBaseUrl;
export const WEB_APP_BASE_URL = env.webAppBaseUrl;

export function getApiBaseUrl(): string {
  if (API_BASE_URL) return API_BASE_URL.replace(/\/$/, "");

  if (ReactNative.Platform.OS === "web" && typeof window !== "undefined" && window.location) {
    const { protocol, hostname } = window.location;
    const apiHostname = hostname.replace(/^8081-/, "3000-");
    if (apiHostname !== hostname) return `${protocol}//${apiHostname}`;
  }

  // Native release builds must provide EXPO_PUBLIC_API_BASE_URL. Returning an
  // empty value is intentional so the app fails visibly instead of sending
  // credentials or project data to an unintended host.
  return "";
}

export function getWebAppBaseUrl(): string {
  try {
    const parsed = new URL(WEB_APP_BASE_URL);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) return "https://virelle.life";
    return parsed.origin;
  } catch {
    return "https://virelle.life";
  }
}

export const SESSION_TOKEN_KEY = "app_session_token";
export const USER_INFO_KEY = "manus-runtime-user-info";

const encodeState = (value: string) => {
  if (typeof globalThis.btoa === "function") return globalThis.btoa(value);
  const BufferImpl = (globalThis as Record<string, any>).Buffer;
  if (BufferImpl) return BufferImpl.from(value, "utf-8").toString("base64");
  return value;
};

export const getRedirectUri = () => {
  if (ReactNative.Platform.OS === "web") {
    const apiBase = getApiBaseUrl();
    if (!apiBase) throw new Error("EXPO_PUBLIC_API_BASE_URL is required for OAuth on web.");
    return `${apiBase}/api/oauth/callback`;
  }
  return Linking.createURL("/oauth/callback", { scheme: env.deepLinkScheme });
};

export const getLoginUrl = () => {
  if (!OAUTH_PORTAL_URL || !APP_ID) {
    throw new Error("OAuth is not configured for this build.");
  }
  const redirectUri = getRedirectUri();
  const state = encodeState(redirectUri);
  const url = new URL(`${OAUTH_PORTAL_URL.replace(/\/$/, "")}/app-auth`);
  url.searchParams.set("appId", APP_ID);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");
  return url.toString();
};

export async function startOAuthLogin(): Promise<string | null> {
  let loginUrl: string;
  try {
    loginUrl = getLoginUrl();
  } catch (error) {
    console.error("[OAuth] Configuration error:", error);
    return null;
  }

  if (ReactNative.Platform.OS === "web") {
    if (typeof window !== "undefined") window.location.href = loginUrl;
    return null;
  }

  try {
    const supported = await Linking.canOpenURL(loginUrl);
    if (!supported) {
      console.warn("[OAuth] Login URL cannot be opened by this device.");
      return null;
    }
    await Linking.openURL(loginUrl);
  } catch (error) {
    console.error("[OAuth] Failed to open login URL:", error);
  }
  return null;
}
