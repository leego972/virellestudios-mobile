import { describe, expect, it } from "vitest";
import {
  TOOL_TO_VIRELLE_CINEMA_ICON,
  VIRELLE_CINEMA_FRAMES,
  VIRELLE_CINEMA_FRAME_SIZE,
  VIRELLE_CINEMA_SPRITE,
  VIRELLE_CINEMA_SPRITE_SIZE,
} from "./virelleCinemaIcons";

const EXPECTED_TOOL_KEYS = [
  "ai_casting",
  "asset_marketplace",
  "budget_estimator",
  "characters",
  "color_grading",
  "content_creator",
  "continuity_checker",
  "credits",
  "credits_editor",
  "dialogue_enhancer",
  "director_chat",
  "full_film_generator",
  "location_scout",
  "mood_board",
  "multi_shot_sequencer",
  "nle_export",
  "poster_maker",
  "referrals",
  "scene_builder",
  "script_writer",
  "settings",
  "shot_list",
  "sound_effects",
  "storyboard",
  "subscription_plans",
  "subtitles",
  "team_collaboration",
  "trailer_studio",
  "vfx_suite",
  "video_generation",
  "visual_effects",
].sort();

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
      EXPECTED_TOOL_KEYS,
    );
  });
});
