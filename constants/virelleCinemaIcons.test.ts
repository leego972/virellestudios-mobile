import { describe, expect, it } from "vitest";
import { TOOL_ICON_IMAGES } from "./hollywoodIcons";
import {
  TOOL_TO_VIRELLE_CINEMA_ICON,
  VIRELLE_CINEMA_FRAMES,
  VIRELLE_CINEMA_FRAME_SIZE,
  VIRELLE_CINEMA_SPRITE,
  VIRELLE_CINEMA_SPRITE_SIZE,
} from "./virelleCinemaIcons";

describe("mobile Virelle cinema icon parity", () => {
  it("bundles the same twenty original cinema concepts", () => {
    expect(Object.keys(VIRELLE_CINEMA_FRAMES)).toHaveLength(20);
    expect(VIRELLE_CINEMA_SPRITE.startsWith("data:image/webp;base64,")).toBe(true);
  });

  it("keeps all mobile sprite frames in bounds", () => {
    for (const frame of Object.values(VIRELLE_CINEMA_FRAMES)) {
      expect(frame.x + VIRELLE_CINEMA_FRAME_SIZE).toBeLessThanOrEqual(
        VIRELLE_CINEMA_SPRITE_SIZE.width,
      );
      expect(frame.y + VIRELLE_CINEMA_FRAME_SIZE).toBeLessThanOrEqual(
        VIRELLE_CINEMA_SPRITE_SIZE.height,
      );
    }
  });

  it("maps every existing mobile Hollywood tool to the new cinema system", () => {
    expect(Object.keys(TOOL_TO_VIRELLE_CINEMA_ICON).sort()).toEqual(
      Object.keys(TOOL_ICON_IMAGES).sort(),
    );
  });
});
