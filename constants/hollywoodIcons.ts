/**
 * Hollywood Icon & Badge System — Mobile Constants
 *
 * Maps tool keys and tier keys to local bundled PNG assets.
 * Use require() for static imports so Metro bundler can resolve them.
 */

// ─── Tier badge image map ────────────────────────────────────────────────────
export type TierBadgeKey = "indie" | "creator" | "industry" | "new" | "featured" | "cinematic";

export const TIER_BADGE_IMAGES: Record<TierBadgeKey, ReturnType<typeof require>> = {
  indie:      require("../assets/images/badges/badge_indie.png"),
  creator:    require("../assets/images/badges/badge_creator.png"),
  industry:   require("../assets/images/badges/badge_industry.png"),
  new:        require("../assets/images/badges/badge_new.png"),
  featured:   require("../assets/images/badges/badge_featured.png"),
  cinematic:  require("../assets/images/badges/badge_cinematic.png"),
};

// ─── Maps subscription tier IDs → badge key ─────────────────────────────────
export const SUBSCRIPTION_TIER_TO_BADGE: Record<string, TierBadgeKey> = {
  indie:       "indie",
  amateur:     "creator",
  independent: "industry",
  creator:     "industry",
  studio:      "industry",
  industry:    "industry",
};

// ─── Tool icon image map ─────────────────────────────────────────────────────
export type ToolIconKey =
  | "ai_casting" | "asset_marketplace" | "budget_estimator" | "characters"
  | "color_grading" | "content_creator" | "continuity_checker" | "credits"
  | "credits_editor" | "dialogue_enhancer" | "director_chat" | "full_film_generator"
  | "location_scout" | "mood_board" | "multi_shot_sequencer" | "nle_export"
  | "poster_maker" | "referrals" | "scene_builder" | "script_writer"
  | "settings" | "shot_list" | "sound_effects" | "storyboard"
  | "subscription_plans" | "subtitles" | "team_collaboration" | "trailer_studio"
  | "vfx_suite" | "video_generation" | "visual_effects";

export const TOOL_ICON_IMAGES: Record<ToolIconKey, ReturnType<typeof require>> = {
  ai_casting:           require("../assets/images/tool-icons/ai_casting.png"),
  asset_marketplace:    require("../assets/images/tool-icons/asset_marketplace.png"),
  budget_estimator:     require("../assets/images/tool-icons/budget_estimator.png"),
  characters:           require("../assets/images/tool-icons/characters.png"),
  color_grading:        require("../assets/images/tool-icons/color_grading.png"),
  content_creator:      require("../assets/images/tool-icons/content_creator.png"),
  continuity_checker:   require("../assets/images/tool-icons/continuity_checker.png"),
  credits:              require("../assets/images/tool-icons/credits.png"),
  credits_editor:       require("../assets/images/tool-icons/credits_editor.png"),
  dialogue_enhancer:    require("../assets/images/tool-icons/dialogue_enhancer.png"),
  director_chat:        require("../assets/images/tool-icons/director_chat.png"),
  full_film_generator:  require("../assets/images/tool-icons/full_film_generator.png"),
  location_scout:       require("../assets/images/tool-icons/location_scout.png"),
  mood_board:           require("../assets/images/tool-icons/mood_board.png"),
  multi_shot_sequencer: require("../assets/images/tool-icons/multi_shot_sequencer.png"),
  nle_export:           require("../assets/images/tool-icons/nle_export.png"),
  poster_maker:         require("../assets/images/tool-icons/poster_maker.png"),
  referrals:            require("../assets/images/tool-icons/referrals.png"),
  scene_builder:        require("../assets/images/tool-icons/scene_builder.png"),
  script_writer:        require("../assets/images/tool-icons/script_writer.png"),
  settings:             require("../assets/images/tool-icons/settings.png"),
  shot_list:            require("../assets/images/tool-icons/shot_list.png"),
  sound_effects:        require("../assets/images/tool-icons/sound_effects.png"),
  storyboard:           require("../assets/images/tool-icons/storyboard.png"),
  subscription_plans:   require("../assets/images/tool-icons/subscription_plans.png"),
  subtitles:            require("../assets/images/tool-icons/subtitles.png"),
  team_collaboration:   require("../assets/images/tool-icons/team_collaboration.png"),
  trailer_studio:       require("../assets/images/tool-icons/trailer_studio.png"),
  vfx_suite:            require("../assets/images/tool-icons/vfx_suite.png"),
  video_generation:     require("../assets/images/tool-icons/video_generation.png"),
  visual_effects:       require("../assets/images/tool-icons/visual_effects.png"),
};

// ─── Nav tab → tool icon key map ─────────────────────────────────────────────
export const NAV_TAB_ICON_MAP: Record<string, ToolIconKey> = {
  index:    "full_film_generator",
  projects: "scene_builder",
  chat:     "director_chat",
  movies:   "video_generation",
  profile:  "settings",
};
