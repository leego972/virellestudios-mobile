import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import type { WebViewNavigation } from "react-native-webview";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getWebAppBaseUrl, SESSION_TOKEN_KEY } from "@/constants/oauth";
import * as SecureStore from "expo-secure-store";
import { COOKIE_NAME } from "@/shared/const";

interface WebViewToolProps {
  label: string;
  webPath: string;
  projectId?: number;
}

const MOBILE_SHELL_CSS = `
  (function() {
    var style = document.createElement('style');
    style.textContent = \`
      [data-testid="dashboard-sidebar"], .desktop-sidebar, .desktop-only-sidebar,
      footer[data-site-footer], [data-testid="site-footer"] { display: none !important; }
      html, body { overscroll-behavior: none; }
      body { padding-top: 0 !important; margin-top: 0 !important; }
    \`;
    document.head.appendChild(style);
    document.documentElement.setAttribute('data-virelle-client', 'mobile-webview');
  })();
  true;
`;

function buildCookieInjectionScript(token: string): string {
  const safeToken = JSON.stringify(token);
  const safeCookieName = JSON.stringify(COOKIE_NAME);
  return `
    (function() {
      var token = ${safeToken};
      var cookieName = ${safeCookieName};
      document.cookie = cookieName + '=' + encodeURIComponent(token) + '; Path=/; Secure; SameSite=Lax';
      window.__VIRELLE_MOBILE_CLIENT__ = true;
    })();
    true;
  `;
}

function resolvePath(webPath: string, projectId?: number): string | null {
  const id = Number.isInteger(projectId) && Number(projectId) > 0 ? String(projectId) : "";
  const path = webPath
    .replace(/:projectId/g, id)
    .replace(/:id/g, id)
    .replace(/:sceneId/g, "");
  if (!path.startsWith("/") || path.includes("\\") || /[\u0000-\u001f\u007f]/.test(path)) return null;
  if (path.includes(":projectId") || path.includes(":id") || path.includes(":sceneId")) return null;
  return path;
}

export default function WebViewTool({ label, webPath, projectId }: WebViewToolProps) {
  const colors = useColors();
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null | undefined>(undefined);

  const webOrigin = getWebAppBaseUrl();
  const resolvedPath = useMemo(() => resolvePath(webPath, projectId), [webPath, projectId]);
  const fullUrl = useMemo(() => {
    if (!resolvedPath) return null;
    try {
      return new URL(resolvedPath, `${webOrigin}/`).toString();
    } catch {
      return null;
    }
  }, [resolvedPath, webOrigin]);

  React.useEffect(() => {
    let active = true;
    SecureStore.getItemAsync(SESSION_TOKEN_KEY)
      .then((token) => { if (active) setSessionToken(token); })
      .catch(() => { if (active) setSessionToken(null); });
    return () => { active = false; };
  }, []);

  function isFirstParty(value: string): boolean {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "https:" && !parsed.username && !parsed.password && parsed.origin === webOrigin;
    } catch {
      return false;
    }
  }

  const handleNavigationRequest = (request: WebViewNavigation) => {
    if (isFirstParty(request.url)) return true;
    try {
      const parsed = new URL(request.url);
      if (["https:", "mailto:"].includes(parsed.protocol) && !parsed.username && !parsed.password) {
        void Linking.openURL(parsed.toString());
      }
    } catch {
      // Invalid and unsafe schemes are blocked.
    }
    return false;
  };

  if (!fullUrl) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={styles.center}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={[styles.errorTitle, { color: colors.foreground }]}>This tool needs a valid project context</Text>
          <Text style={[styles.errorDesc, { color: colors.muted }]}>Open the tool from a Virelle project and try again.</Text>
          <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
            <Text style={styles.retryText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  if (Platform.OS === "web") {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()}><Text style={[styles.back, { color: colors.primary }]}>‹ Back</Text></TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>{label}</Text>
          <View style={{ width: 48 }} />
        </View>
        <View style={styles.center}>
          <Text style={styles.icon}>🌐</Text>
          <Text style={[styles.webTitle, { color: colors.foreground }]}>{label}</Text>
          <Text style={[styles.webDesc, { color: colors.muted }]}>This tool opens in the canonical Virelle web app.</Text>
          <TouchableOpacity style={[styles.openBtn, { backgroundColor: colors.primary }]} onPress={() => void Linking.openURL(fullUrl)}>
            <Text style={styles.openBtnText}>Open Virelle</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.back, { color: colors.primary }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>{label}</Text>
        <TouchableOpacity style={styles.reloadBtn} onPress={() => { setHasError(false); webViewRef.current?.reload(); }}>
          <Text style={[styles.reloadText, { color: colors.muted }]}>↻</Text>
        </TouchableOpacity>
      </View>

      {loadProgress > 0 && loadProgress < 1 && (
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${loadProgress * 100}%` }]} />
        </View>
      )}

      {sessionToken === undefined ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>Preparing secure Virelle session…</Text>
        </View>
      ) : hasError ? (
        <View style={styles.center}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={[styles.errorTitle, { color: colors.foreground }]}>Could not load {label}</Text>
          <Text style={[styles.errorDesc, { color: colors.muted }]}>Check your connection or sign in again.</Text>
          <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={() => { setHasError(false); webViewRef.current?.reload(); }}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          ref={webViewRef}
          source={{ uri: fullUrl }}
          originWhitelist={[webOrigin]}
          injectedJavaScriptBeforeContentLoaded={sessionToken ? buildCookieInjectionScript(sessionToken) : "true;"}
          injectedJavaScript={MOBILE_SHELL_CSS}
          onShouldStartLoadWithRequest={handleNavigationRequest}
          onLoadProgress={({ nativeEvent }) => setLoadProgress(nativeEvent.progress)}
          onLoadEnd={() => setLoadProgress(1)}
          onError={() => setHasError(true)}
          onHttpError={({ nativeEvent }) => {
            if (nativeEvent.statusCode === 401 || nativeEvent.statusCode === 403 || nativeEvent.statusCode >= 500) setHasError(true);
          }}
          startInLoadingState
          renderLoading={() => (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.muted }]}>Loading {label}…</Text>
            </View>
          )}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled={false}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, paddingTop: 52 },
  backBtn: { minWidth: 48, alignItems: "flex-start" },
  back: { fontSize: 16 },
  title: { fontSize: 16, fontWeight: "600", flex: 1, textAlign: "center" },
  reloadBtn: { minWidth: 48, alignItems: "flex-end" },
  reloadText: { fontSize: 20 },
  progressBar: { height: 2, width: "100%" },
  progressFill: { height: 2 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  icon: { fontSize: 48 },
  webTitle: { fontSize: 20, fontWeight: "700" },
  webDesc: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  openBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  openBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  errorIcon: { fontSize: 48 },
  errorTitle: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  errorDesc: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  retryText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14 },
});
