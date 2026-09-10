import "./scripts/load-env.js";
import type { ExpoConfig } from "expo/config";

const appVariant = process.env.EXPO_PUBLIC_APP_VARIANT === "swappys" ? "swappys" : "virelle";
const isSwappys = appVariant === "swappys";
const rawBundleId = isSwappys
  ? "space.manus.swappys.mobile"
  : "space.manus.virellestudios.mobile.t20260317065920";
const bundleId = rawBundleId
  .replace(/[-_]/g, ".")
  .replace(/[^a-zA-Z0-9.]/g, "")
  .replace(/\.+/g, ".")
  .replace(/^\.+|\.+$/g, "")
  .toLowerCase()
  .split(".")
  .map((segment) => /^[a-zA-Z]/.test(segment) ? segment : `x${segment}`)
  .join(".") || (isSwappys ? "space.manus.swappys.mobile" : "space.manus.virellestudios.mobile");

const timestamp = bundleId.split(".").pop()?.replace(/^t/, "") ?? "";
const oauthScheme = isSwappys ? "swappys" : `manus${timestamp}`;
const appName = isSwappys ? "Swappys" : "Virelle Studios";
const appSlug = isSwappys ? "swappys-mobile" : "virellestudios-mobile";

const config: ExpoConfig = {
  name: appName,
  slug: appSlug,
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: isSwappys ? ["swappys", "virelle"] : [oauthScheme, "virelle"],
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: bundleId,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#0a0a0f",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: bundleId,
    permissions: ["POST_NOTIFICATIONS", "CAMERA", "READ_MEDIA_IMAGES", "READ_MEDIA_VIDEO"],
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: isSwappys
          ? [{ scheme: "swappys", host: "*" }, { scheme: "virelle", host: "*" }]
          : [{ scheme: oauthScheme, host: "*" }, { scheme: "virelle", host: "*" }],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-image-picker",
      {
        photosPermission: isSwappys
          ? "Allow Swappys to access your photo library to select source and target images."
          : "Allow $(PRODUCT_NAME) to access your photo library to select production references.",
        cameraPermission: isSwappys
          ? "Allow Swappys to use your camera when you choose to capture an image."
          : "Allow $(PRODUCT_NAME) to access your camera when you choose to capture production media.",
      },
    ],
    [
      "expo-notifications",
      { iosDisplayInForeground: true },
    ],
    [
      "expo-audio",
      { microphonePermission: "Allow $(PRODUCT_NAME) to access your microphone for voice and production audio tools." },
    ],
    [
      "expo-video",
      {
        supportsBackgroundPlayback: true,
        supportsPictureInPicture: true,
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#0a0a0f",
        dark: { backgroundColor: "#0a0a0f" },
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          buildArchs: ["armeabi-v7a", "arm64-v8a"],
          minSdkVersion: 24,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    eas: { projectId: "b80d389f-d641-4b29-94b6-85c8d6011b55" },
    appVariant,
    canonicalWebApp: "https://virelle.life",
  },
};

export default config;
