import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const toolRoute = readFileSync("app/tool/[name].tsx", "utf8");
const allTools = readFileSync("components/tools/AllTools.tsx", "utf8");
const webView = readFileSync("components/tools/WebViewTool.tsx", "utf8");
const registryHook = readFileSync("hooks/use-feature-registry.ts", "utf8");

describe("Virelle mobile website parity contract", () => {
  it("uses the live website feature registry as the tool source of truth", () => {
    expect(registryHook).toContain("/api/mobile/features");
    expect(toolRoute).toContain("useFeatureRegistry");
    expect(allTools).toContain("useFeatureRegistry");
  });

  it("falls back to the authenticated web surface when no native tool exists", () => {
    expect(toolRoute).toContain("<WebViewTool");
    expect(toolRoute).toContain("feature.webPath");
    expect(webView).toContain("SESSION_TOKEN_KEY");
    expect(webView).toContain("sharedCookiesEnabled");
    expect(webView).toContain("parsed.origin === webOrigin");
  });

  it("keeps website subscription gating authoritative instead of a duplicate hard-coded table", () => {
    expect(toolRoute).toContain("feature?.minTier");
    expect(toolRoute).not.toContain("const TOOL_MIN_TIER");
  });

  it("routes Director Chat to its dedicated native tab", () => {
    expect(toolRoute).toContain('name === "director-chat"');
    expect(toolRoute).toContain('router.replace("/(tabs)/chat"');
  });
});
