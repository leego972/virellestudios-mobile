#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const fail = (message) => {
  console.error(`PARITY FAIL: ${message}`);
  process.exitCode = 1;
};

const registrySource = read("hooks/use-feature-registry.ts");
const toolRouteSource = read("app/tool/[name].tsx");
const allToolsSource = read("components/tools/AllTools.tsx");
const rootLayoutSource = read("app/_layout.tsx");
const tabsSource = read("app/(tabs)/_layout.tsx");

const registryEntries = [...registrySource.matchAll(/id:\s*["']([^"']+)["'][\s\S]*?hasNative:\s*(true|false)/g)]
  .map((match) => ({ id: match[1], hasNative: match[2] === "true" }));
const registryIds = new Set(registryEntries.map((entry) => entry.id));
const nativeRegistryIds = registryEntries.filter((entry) => entry.hasNative).map((entry) => entry.id);
const toolMapIds = new Set([...toolRouteSource.matchAll(/^[\t ]*["']([^"']+)["']:\s*[A-Za-z0-9_]+/gm)].map((match) => match[1]));
const tierMapIds = new Set([...toolRouteSource.matchAll(/^[\t ]*["']([^"']+)["']:\s*["'](?:free|indie|amateur|independent|industry)["']/gm)].map((match) => match[1]));

if (!registryEntries.length) fail("No bundled feature-registry entries were detected.");

for (const id of nativeRegistryIds) {
  if (id === "director-chat") continue; // dedicated tab route, not TOOL_MAP
  if (!toolMapIds.has(id)) fail(`Registry marks '${id}' as native, but TOOL_MAP has no component.`);
}

for (const id of toolMapIds) {
  if (!registryIds.has(id) && !["all-tools", "privacy", "terms", "notifications"].includes(id)) {
    fail(`TOOL_MAP exposes '${id}', but it is absent from the bundled registry.`);
  }
}

for (const id of toolMapIds) {
  if (!tierMapIds.has(id)) fail(`TOOL_MAP route '${id}' has no explicit TOOL_MIN_TIER entry.`);
}

if (!allToolsSource.includes('pathname: "/tool/webview"')) {
  fail("All Tools lacks the WebView fallback required for non-native website features.");
}
if (!rootLayoutSource.includes('<Stack.Screen name="tool/[name]"')) {
  fail("Root navigation does not register the dynamic native tool route.");
}
if (!tabsSource.includes('name="projects"') || !tabsSource.includes('name="chat"') || !tabsSource.includes('name="movies"') || !tabsSource.includes('name="profile"')) {
  fail("Required primary mobile tabs are missing.");
}
if (!registrySource.includes("/api/mobile/features")) {
  fail("The mobile app is not connected to the live website feature registry.");
}
if (!registrySource.includes("BUNDLED_REGISTRY")) {
  fail("Offline feature-registry fallback is missing.");
}

if (!process.exitCode) {
  console.log(`PARITY PASS: ${registryEntries.length} bundled website features checked; ${nativeRegistryIds.length} native routes verified.`);
}
