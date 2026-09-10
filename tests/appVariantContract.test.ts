import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const home = readFileSync("app/(tabs)/index.tsx", "utf8");
const config = readFileSync("app.config.ts", "utf8");

describe("app variant contract", () => {
  it("routes the Swappys build directly to the native transformation experience", () => {
    expect(home).toContain('if (IS_SWAPPYS) return <BodyFaceSwap />;');
    expect(home).not.toContain('Swappys Identity Banner');
  });

  it("keeps Virelle as the safe default while allowing an explicit Swappys build", () => {
    expect(config).toContain('EXPO_PUBLIC_APP_VARIANT === "swappys"');
    expect(config).toContain('appVariant');
    expect(config).toContain('canonicalWebApp: "https://virelle.life"');
  });
});
