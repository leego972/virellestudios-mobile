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
const homeSource = read("app/(tabs)/index.tsx");

function extractObjectBlock(source, declaration) {
  const start = source.indexOf(declaration);
  if (start < 0) return "";
  const open = source.indexOf("{", start);
  if (open < 0) return "";
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let i = open; i < source.length; i += 1) {
    const char = source[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") { quote = char; continue; }
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }
  return "";
}

const bundledBlock = extractObjectBlock(registrySource, "const BUNDLED_REGISTRY");
const toolMapBlock = extractObjectBlock(toolRouteSource, "const TOOL_MAP");
const tierMapBlock = extractObjectBlock(toolRouteSource, "const TOOL_MIN_TIER");

const registryEntries = [...bundledBlock.matchAll(/\{\s*id:\s*["']([^"']+)["'][\s\S]*?hasNative:\s*(true|false)[\s\S]*?\}/g)]
  .map((match) => ({ id: match[1], hasNative: match[2] === "true" }));
const registryIds = new Set(registryEntries.map((entry) => entry.id));
const nativeRegistryIds = registryEntries.filter((entry) => entry.hasNative).map((entry) => entry.id);
const toolMapIds = new Set([...toolMapBlock.matchAll(/^[\t ]*["']([^"']+)["']:\s*[A-Za-z0-9_]+/gm)].map((match) => match[1]));
const tierMapIds = new Set([...tierMapBlock.matchAll(/^[\t ]*["']([^"']+)["']:\s*["'](?:free|indie|amateur|independent|industry)["']/gm)].map((match) => match[1]));

if (!bundledBlock) fail("Could not isolate BUNDLED_REGISTRY.");
if (!toolMapBlock) fail("Could not isolate TOOL_MAP.");
if (!tierMapBlock) fail("Could not isolate TOOL_MIN_TIER.");
if (!registryEntries.length) fail("No bundled feature-registry entries were detected.");

for (const id of nativeRegistryIds) {
  if (id === "director-chat") continue;
  if (!toolMapIds.has(id)) fail(`Registry marks '${id}' as native, but TOOL_MAP has no component.`);
}

for (const id of toolMapIds) {
  if (!registryIds.has(id) && !["all-tools", "privacy", "terms", "notifications"].includes(id)) {
    fail(`TOOL_MAP exposes '${id}', but it is absent from the bundled registry.`);
  }
  if (!tierMapIds.has(id)) fail(`TOOL_MAP route '${id}' has no explicit TOOL_MIN_TIER entry.`);
}

if (!allToolsSource.includes('pathname: "/tool/webview"')) fail("All Tools lacks the WebView fallback required for non-native website features.");
if (!rootLayoutSource.includes('<Stack.Screen name="tool/[name]"')) fail("Root navigation does not register the dynamic native tool route.");
if (!["projects", "chat", "movies", "profile"].every((name) => tabsSource.includes(`name="${name}"`))) fail("Required primary mobile tabs are missing.");
if (!tabsSource.includes('@/constants/app-variant')) fail("Tabs do not use the shared app-variant helper.");
if (!registrySource.includes("/api/mobile/features")) fail("The mobile app is not connected to the live website feature registry.");
if (!registrySource.includes("BUNDLED_REGISTRY")) fail("Offline feature-registry fallback is missing.");
if (homeSource.includes("Swappys Mobile") && !homeSource.includes("IS_SWAPPYS")) fail("Swappys branding exists on Home without variant gating.");

if (!process.exitCode) {
  console.log(`PARITY PASS: ${registryEntries.length} bundled website features checked; ${nativeRegistryIds.length} native routes verified.`);
}
