import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { TIER_ORDER } from "@/shared/_core/subscription-constants";

// Lazy-loaded tool screens
import ScriptWriterScreen from "@/components/tools/ScriptWriter";
import StoryboardScreen from "@/components/tools/Storyboard";
import ShotListScreen from "@/components/tools/ShotList";
import VideoGenerationScreen from "@/components/tools/VideoGeneration";
import TrailerScreen from "@/components/tools/Trailer";
import DialogueScreen from "@/components/tools/Dialogue";
import BudgetScreen from "@/components/tools/Budget";
import ContinuityScreen from "@/components/tools/Continuity";
import SubtitlesScreen from "@/components/tools/Subtitles";
import SceneBuilderScreen from "@/components/tools/SceneBuilder";
import CharactersScreen from "@/components/tools/Characters";
import TeamScreen from "@/components/tools/Team";
import SubscriptionScreen from "@/components/tools/Subscription";
import ReferralsScreen from "@/components/tools/Referrals";
import CreditsScreen from "@/components/tools/Credits";
import AllToolsScreen from "@/components/tools/AllTools";
import FilmGeneratorScreen from "@/components/tools/FilmGenerator";
import PrivacyScreen from "@/components/tools/Privacy";
import TermsScreen from "@/components/tools/Terms";
import FilmPostProductionScreen from "@/components/tools/FilmPostProduction";
import FundingDirectoryScreen from "@/components/tools/FundingDirectory";
import NotificationSettingsScreen from "@/components/tools/NotificationSettings";
import MoodBoardScreen from "@/components/tools/MoodBoard";
import ColorGradingScreen from "@/components/tools/ColorGrading";
import SoundEffectsScreen from "@/components/tools/SoundEffects";
import CreditsEditorScreen from "@/components/tools/CreditsEditor";
import SceneEditorScreen from "@/components/tools/SceneEditor";

/**
 * Minimum subscription tier required to access each tool.
 * Mirrors the minTier values in hooks/use-feature-registry.ts.
 * Tools not listed here are treated as "free" (always accessible).
 */
// Mirrors minTier in hooks/use-feature-registry.ts.
// Three canonical tiers: indie (Indie), amateur (Creator), independent (Industry).
const TOOL_MIN_TIER: Record<string, string> = {
  // Writing
  "script-writer":        "indie",
  "dialogue":             "indie",
  "scene-builder":        "free",
  "scene-editor":         "free",
  // Visual
  "storyboard":           "amateur",
  "mood-board":           "indie",
  "color-grading":        "amateur",
  // AI Video
  "video-generation":     "amateur",
  "trailer":              "independent",
  "film-generator":       "independent",
  // Production
  "shot-list":            "indie",
  "budget":               "indie",
  "characters":           "free",
  // Post-Production
  "subtitles":            "amateur",
  "continuity":           "amateur",
  "sound-effects":        "amateur",
  "film-post-production": "independent",
  // Management
  "team":                 "independent",
  "credits-editor":       "amateur",
  "funding-directory":    "independent",
  // Account (always free)
  "subscription":         "free",
  "credits":              "free",
  "referrals":            "free",
  "all-tools":            "free",
  "notifications":        "free",
  "privacy":              "free",
  "terms":                "free",
};

/** Human-readable tier display names for upgrade alerts. Three public tiers: Indie, Creator, Industry. */
const TIER_DISPLAY: Record<string, string> = {
  free:        "Free",
  indie:       "Indie",
  amateur:     "Creator",
  independent: "Industry",
  creator:     "Industry",  // alias
  studio:      "Industry",  // alias
  industry:    "Industry",
  beta:        "Beta",
};

const TOOL_MAP: Record<string, React.ComponentType<{ projectId?: number }>> = {
  "script-writer": ScriptWriterScreen,
  "storyboard": StoryboardScreen,
  "shot-list": ShotListScreen,
  "video-generation": VideoGenerationScreen,
  "trailer": TrailerScreen,
  "dialogue": DialogueScreen,
  "budget": BudgetScreen,
  "continuity": ContinuityScreen,
  "subtitles": SubtitlesScreen,
  "scene-builder": SceneBuilderScreen,
  "characters": CharactersScreen,
  "team": TeamScreen,
  "subscription": SubscriptionScreen,
  "referrals": ReferralsScreen,
  "credits": CreditsScreen,
  "all-tools": AllToolsScreen,
  "film-generator": FilmGeneratorScreen,
  "privacy": PrivacyScreen,
  "terms": TermsScreen,
  "film-post-production": FilmPostProductionScreen,
  "funding-directory": FundingDirectoryScreen,
  "notifications": NotificationSettingsScreen,
  "mood-board": MoodBoardScreen,
  "color-grading": ColorGradingScreen,
  "sound-effects": SoundEffectsScreen,
  "credits-editor": CreditsEditorScreen,
  "scene-editor": SceneEditorScreen,
};

export default function ToolScreen() {
  const { name, projectId } = useLocalSearchParams<{ name: string; projectId?: string }>();
  const colors = useColors();
  const router = useRouter();
  const { data: creditsData } = trpc.credits.balance.useQuery();

  const ToolComponent = TOOL_MAP[name];

  // ── Tier gating ──────────────────────────────────────────────────────────
  const currentTier = creditsData?.tier ?? "none";
  const minTier = TOOL_MIN_TIER[name] ?? "free";

  function canUseTool(): boolean {
    if (minTier === "free" || minTier === "none") return true;
    const userIdx = TIER_ORDER.indexOf(currentTier as (typeof TIER_ORDER)[number]);
    const reqIdx  = TIER_ORDER.indexOf(minTier as (typeof TIER_ORDER)[number]);
    if (userIdx === -1) return false; // not subscribed
    return userIdx >= reqIdx;
  }

  if (ToolComponent && !canUseTool()) {
    const tierLabel = TIER_DISPLAY[minTier] ?? minTier;
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.back, { color: colors.primary }]}>‹ Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={[styles.lockedTitle, { color: colors.foreground }]}>Upgrade Required</Text>
          <Text style={[styles.lockedSubtitle, { color: colors.muted }]}>
            This tool requires the{" "}
            <Text style={{ fontWeight: "700", color: colors.primary }}>{tierLabel}</Text> plan or
            higher.
          </Text>
          <TouchableOpacity
            style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
            onPress={() => router.replace("/tool/subscription" as never)}
          >
            <Text style={styles.upgradeText}>View Plans</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.cancelText, { color: colors.muted }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  if (!ToolComponent) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.back, { color: colors.primary }]}>‹ Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Text style={styles.notFoundIcon}>🔧</Text>
          <Text style={[styles.notFoundTitle, { color: colors.foreground }]}>Tool Not Found</Text>
          <Text style={[styles.notFoundSubtitle, { color: colors.muted }]}>
            The tool "{name}" is not available yet.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return <ToolComponent projectId={projectId ? Number(projectId) : undefined} />;
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingVertical: 14 },
  back: { fontSize: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 32 },
  // Locked state
  lockIcon: { fontSize: 52 },
  lockedTitle: { fontSize: 22, fontWeight: "800", textAlign: "center" },
  lockedSubtitle: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  upgradeButton: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 4,
  },
  upgradeText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  cancelText: { fontSize: 14, marginTop: 4 },
  // Not found state
  notFoundIcon: { fontSize: 48 },
  notFoundTitle: { fontSize: 20, fontWeight: "700" },
  notFoundSubtitle: { fontSize: 14, textAlign: "center" },
});
