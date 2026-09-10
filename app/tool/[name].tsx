import React, { useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useFeatureRegistry } from "@/hooks/use-feature-registry";
import { trpc } from "@/lib/trpc";
import { TIER_ORDER } from "@/shared/_core/subscription-constants";
import WebViewTool from "@/components/tools/WebViewTool";

// Native tool screens. The live website feature registry remains the source of
// truth: when a feature has no native screen, this route falls back to the
// authenticated WebView so mobile does not lose access to website features.
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

const NATIVE_TOOL_MAP: Record<string, React.ComponentType<{ projectId?: number }>> = {
  "script-writer": ScriptWriterScreen,
  storyboard: StoryboardScreen,
  "shot-list": ShotListScreen,
  "video-generation": VideoGenerationScreen,
  trailer: TrailerScreen,
  dialogue: DialogueScreen,
  budget: BudgetScreen,
  continuity: ContinuityScreen,
  subtitles: SubtitlesScreen,
  "scene-builder": SceneBuilderScreen,
  characters: CharactersScreen,
  team: TeamScreen,
  subscription: SubscriptionScreen,
  referrals: ReferralsScreen,
  credits: CreditsScreen,
  "all-tools": AllToolsScreen,
  "film-generator": FilmGeneratorScreen,
  privacy: PrivacyScreen,
  terms: TermsScreen,
  "film-post-production": FilmPostProductionScreen,
  "funding-directory": FundingDirectoryScreen,
  notifications: NotificationSettingsScreen,
  "mood-board": MoodBoardScreen,
  "color-grading": ColorGradingScreen,
  "sound-effects": SoundEffectsScreen,
  "credits-editor": CreditsEditorScreen,
  "scene-editor": SceneEditorScreen,
};

const TIER_DISPLAY: Record<string, string> = {
  free: "Free",
  indie: "Indie",
  amateur: "Creator",
  independent: "Industry",
  creator: "Industry",
  studio: "Industry",
  industry: "Industry",
  beta: "Beta",
};

export default function ToolScreen() {
  const { name, projectId } = useLocalSearchParams<{ name: string; projectId?: string }>();
  const colors = useColors();
  const router = useRouter();
  const { registry, loading } = useFeatureRegistry();
  const { data: creditsData } = trpc.credits.balance.useQuery();
  const parsedProjectId = projectId && Number(projectId) > 0 ? Number(projectId) : undefined;
  const feature = registry.features.find((entry) => entry.id === name);
  const NativeTool = NATIVE_TOOL_MAP[name];

  // Director Chat is a first-class tab rather than a nested tool screen.
  useEffect(() => {
    if (name === "director-chat") router.replace("/(tabs)/chat" as never);
  }, [name, router]);

  if (name === "director-chat") {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  const currentTier = creditsData?.tier ?? "none";
  const minTier = feature?.minTier ?? "free";
  const canUseTool = (() => {
    if (minTier === "free") return true;
    const userIdx = TIER_ORDER.indexOf(currentTier as (typeof TIER_ORDER)[number]);
    const reqIdx = TIER_ORDER.indexOf(minTier as (typeof TIER_ORDER)[number]);
    return userIdx !== -1 && reqIdx !== -1 && userIdx >= reqIdx;
  })();

  if (feature && !canUseTool) {
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
            {feature.label} requires the{" "}
            <Text style={{ fontWeight: "700", color: colors.primary }}>{tierLabel}</Text> plan or higher.
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

  if (NativeTool) {
    return <NativeTool projectId={parsedProjectId} />;
  }

  // Critical parity fallback: every feature advertised by the live website
  // remains usable in mobile even before a dedicated native screen ships.
  if (feature) {
    return <WebViewTool label={feature.label} webPath={feature.webPath} projectId={parsedProjectId} />;
  }

  if (loading) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.notFoundSubtitle, { color: colors.muted }]}>Checking Virelle tools…</Text>
        </View>
      </ScreenContainer>
    );
  }

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
          The tool "{name}" is not currently advertised by Virelle Studios.
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingVertical: 14 },
  back: { fontSize: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 32 },
  lockIcon: { fontSize: 52 },
  lockedTitle: { fontSize: 22, fontWeight: "800", textAlign: "center" },
  lockedSubtitle: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  upgradeButton: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 24, marginTop: 4 },
  upgradeText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  cancelText: { fontSize: 14, marginTop: 4 },
  notFoundIcon: { fontSize: 48 },
  notFoundTitle: { fontSize: 20, fontWeight: "700" },
  notFoundSubtitle: { fontSize: 14, textAlign: "center" },
});
