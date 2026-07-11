import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Linking,
} from "react-native";
import { WebView } from "react-native-webview";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getApiBaseUrl, SESSION_TOKEN_KEY } from "@/constants/oauth";
import * as SecureStore from "expo-secure-store";

interface WebViewToolProps {
  label: string;
  webPath: string;
  projectId?: number;
}

const HIDE_NAV_CSS = `
  (function() {
    var style = document.createElement('style');
    style.textContent = \`
      nav, header, .navbar, [class*="nav-"], [class*="header-"],
      [class*="Navbar"], [class*="Header"], [data-testid="navbar"],
      footer, [class*="footer-"], [class*="Footer"] {
        display: none !important;
      }
      body { padding-top: 0 !important; margin-top: 0 !important; }
    \`;
    document.head.appendChild(style);
  })();
  true;
`;

function buildTokenInjectionScript(token: string): string {
  const encodedToken = JSON.stringify(token);
  return `
    (function() {
      var token = ${encodedToken};
      var secure = location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = 'session_token=' + encodeURIComponent(token) + '; path=/; SameSite=Lax' + secure;
      document.cookie = 'auth_token=' + encodeURIComponent(token) + '; path=/; SameSite=Lax' + secure;
    })();
    true;
  `;
}

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/$/, "");
}

function isSameOrigin(candidate: string, baseUrl: string): boolean {
  try {
    return new URL(candidate).origin === new URL(baseUrl).origin;
  } catch {
    return false;
  }
}

export default function WebViewTool({ label, webPath, projectId }: WebViewToolProps) {
  const colors = useColors();
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null | undefined>(undefined);

  const baseUrl = normalizeBaseUrl(getApiBaseUrl() || "");
  const resolvedPath = webPath
    .replace(/:projectId/g, String(projectId ?? ""))
    .replace(/:id/g, String(projectId ?? ""))
    .replace(/:sceneId/g, "");
  const fullUrl = baseUrl ? `${baseUrl}${resolvedPath.startsWith("/") ? resolvedPath : `/${resolvedPath}`}` : resolvedPath;

  React.useEffect(() => {
    let active = true;
    SecureStore.getItemAsync(SESSION_TOKEN_KEY)
      .then((token) => { if (active) setSessionToken(token); })
      .catch(() => { if (active) setSessionToken(null); });
    return () => { active = false; };
  }, []);

  const authScript = useMemo(
    () => (sessionToken ? buildTokenInjectionScript(sessionToken) : "true;"),
    [sessionToken],
  );

  const handleLoadEnd = () => {
    setLoadProgress(1);
    webViewRef.current?.injectJavaScript(HIDE_NAV_CSS);
  };

  if (Platform.OS === "web") {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.back, { color: colors.primary }]}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>{label}</Text>
          <View style={{ width: 48 }} />
        </View>
        <View style={styles.center}>
          <Text style={styles.icon}>🌐</Text>
          <Text style={[styles.webTitle, { color: colors.foreground }]}>{label}</Text>
          <Text style={[styles.webDesc, { color: colors.muted }]}>This tool opens in the full web app.</Text>
          <TouchableOpacity
            style={[styles.openBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              if (typeof window !== "undefined" && fullUrl) window.open(fullUrl, "_blank", "noopener,noreferrer");
            }}
          >
            <Text style={styles.openBtnText}>Open in Browser</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  if (sessionToken === undefined) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.muted }]}>Preparing secure session…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.back, { color: colors.primary }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>{label}</Text>
        <TouchableOpacity
          style={styles.reloadBtn}
          onPress={() => {
            setHasError(false);
            setLoadProgress(0);
            webViewRef.current?.reload();
          }}
        >
          <Text style={[styles.reloadText, { color: colors.muted }]}>↻</Text>
        </TouchableOpacity>
      </View>

      {loadProgress > 0 && loadProgress < 1 && (
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${loadProgress * 100}%` }]} />
        </View>
      )}

      {hasError ? (
        <View style={styles.center}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={[styles.errorTitle, { color: colors.foreground }]}>Could not load {label}</Text>
          <Text style={[styles.errorDesc, { color: colors.muted }]}>Check your internet connection and try again.</Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              setHasError(false);
              setLoadProgress(0);
              webViewRef.current?.reload();
            }}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          ref={webViewRef}
          source={{ uri: fullUrl }}
          style={styles.webview}
          originWhitelist={["https://*"]}
          injectedJavaScriptBeforeContentLoaded={authScript}
          injectedJavaScript={HIDE_NAV_CSS}
          onLoadStart={() => setLoadProgress(0.05)}
          onLoadProgress={({ nativeEvent }) => setLoadProgress(nativeEvent.progress)}
          onLoadEnd={handleLoadEnd}
          onError={() => setHasError(true)}
          onHttpError={({ nativeEvent }) => {
            if (nativeEvent.statusCode >= 400) setHasError(true);
          }}
          onShouldStartLoadWithRequest={(request) => {
            if (!request.url || request.url === "about:blank") return true;
            if (isSameOrigin(request.url, baseUrl)) return true;
            if (/^https:\/\//i.test(request.url)) void Linking.openURL(request.url);
            return false;
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    paddingTop: 52,
  },
  backBtn: { minWidth: 48, alignItems: "flex-start" },
  back: { fontSize: 16 },
  title: { fontSize: 16, fontWeight: "600", flex: 1, textAlign: "center" },
  reloadBtn: { minWidth: 48, alignItems: "flex-end" },
  reloadText: { fontSize: 20 },
  progressBar: { height: 2, width: "100%" },
  progressFill: { height: 2 },
  webview: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  icon: { fontSize: 48 },
  webTitle: { fontSize: 20, fontWeight: "700" },
  webDesc: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  openBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  openBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  errorIcon: { fontSize: 48 },
  errorTitle: { fontSize: 18, fontWeight: "700" },
  errorDesc: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  retryText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14 },
});
