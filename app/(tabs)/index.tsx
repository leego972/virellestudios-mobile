import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { TIER_ORDER } from "@/shared/_core/subscription-constants";
import { HollywoodIcon } from "@/components/hollywood-badge";
import type { ToolIconKey } from "@/constants/hollywoodIcons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Quick Action Tools ───────────────────────────────────────────────────────
// minTier must match the feature registry (hooks/use-feature-registry.ts).
// voice-acting → sound-effects (independent), film-score → film-post-production (independent)
const QUICK_TOOLS: Array<{ id: string; label: string; toolIcon: ToolIconKey; route: string; color: string; minTier: string }> = [
  { id: "director-chat",        label: "Director Chat",  toolIcon: "director_chat",       route: "/(tabs)/chat",               color: "#8B5CF6", minTier: "free"        },
  { id: "script-writer",        label: "Script Writer",  toolIcon: "script_writer",       route: "/tool/script-writer",        color: "#3B82F6", minTier: "indie"       },
  { id: "storyboard",           label: "Storyboard",     toolIcon: "storyboard",          route: "/tool/storyboard",           color: "#F59E0B", minTier: "amateur"     },
  { id: "video-generation",     label: "Video Gen",      toolIcon: "video_generation",    route: "/tool/video-generation",     color: "#EF4444", minTier: "amateur"     },
  { id: "sound-effects",        label: "Sound Effects",  toolIcon: "sound_effects",       route: "/tool/sound-effects",        color: "#10B981", minTier: "amateur"     },
  { id: "film-post-production", label: "Film Score",     toolIcon: "full_film_generator", route: "/tool/film-post-production", color: "#EC4899", minTier: "independent" },
];

// ─── Tier display labels used for upgrade alerts ──────────────────────────────
// Three public tiers: Indie, Creator, Industry. creator/studio are aliases for Industry.
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

// ─── Production Stats ─────────────────────────────────────────────────────────
const PLATFORM_STATS = [
  { label: "AI Models", value: "35+" },
  { label: "Languages", value: "130+" },
  { label: "Voice Styles", value: "3,000+" },
  { label: "Film Tools", value: "30+" },
];

// ─── Subscription tier display names (3 public tiers) ───────────────────────
const TIER_LABELS: Record<string, { name: string; color: string }> = {
  free:        { name: "Free",     color: "#6B7280" },
  indie:       { name: "Indie",    color: "#10B981" },
  amateur:     { name: "Creator",  color: "#F59E0B" },
  independent: { name: "Industry", color: "#8B5CF6" },
  creator:     { name: "Industry", color: "#8B5CF6" }, // alias
  studio:      { name: "Industry", color: "#8B5CF6" }, // alias
  industry:    { name: "Industry", color: "#8B5CF6" },
  beta:        { name: "Beta",     color: "#6B7280" },
  // Legacy aliases
  beginner:    { name: "Indie",    color: "#10B981" },
};

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth({ autoFetch: true });
  const { data: creditsData } = trpc.credits.balance.useQuery();
  const { data: projects } = trpc.projects.list.useQuery();

  const recentProjects = projects?.slice(0, 3) ?? [];
  const tier = TIER_LABELS[creditsData?.tier ?? "free"] ?? TIER_LABELS.free;
  const creditPct = creditsData?.isUnlimited
    ? 100
    : Math.min(100, Math.round(((creditsData?.credits ?? 0) / (creditsData?.totalCredits ?? 1)) * 100));

  const currentTier = creditsData?.tier ?? "none";

  /** Returns true if the user's current tier meets or exceeds minTier. */
  function canUseTool(minTier: string): boolean {
    if (minTier === "free" || minTier === "none") return true;
    const userIdx = TIER_ORDER.indexOf(currentTier as any);
    const reqIdx  = TIER_ORDER.indexOf(minTier as any);
    if (userIdx === -1) return false; // not subscribed
    return userIdx >= reqIdx;
  }

  /** Navigate to a Quick Action tool, showing an upgrade alert if the user's
   *  tier is insufficient. */
  function openQuickTool(tool: typeof QUICK_TOOLS[number]) {
    if (!canUseTool(tool.minTier)) {
      const tierLabel = TIER_DISPLAY[tool.minTier] ?? tool.minTier;
      Alert.alert(
        "Upgrade Required",
        `${tool.label} requires the ${tierLabel} plan or higher. Upgrade your subscription to unlock this tool.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "View Plans", onPress: () => router.push("/tool/subscription" as never) },
        ]
      );
      return;
    }
    router.push(tool.route as never);
  }

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.greeting, { color: colors.muted }]}>Welcome back</Text>
            <Text style={[styles.userName, { color: colors.foreground }]}>
              {user?.name || "Director"}
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/tool/subscription" as never)}>
            <Image
              source={require("@/assets/images/icon.png")}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>

          {/* ── Credits & Plan Card ────────────────────────────────────────── */}
          <View style={[styles.creditsCard, { backgroundColor: colors.surface, borderColor: tier.color + "40" }]}>
            {/* Top row: tier badge + upgrade button */}
            <View style={styles.creditsTopRow}>
              <View style={[styles.tierBadge, { backgroundColor: tier.color + "20" }]}>
                <View style={[styles.tierDot, { backgroundColor: tier.color }]} />
                <Text style={[styles.tierText, { color: tier.color }]}>{tier.name} Plan</Text>
              </View>
              {creditsData?.tier === "free" || !creditsData?.tier ? (
                <TouchableOpacity
                  style={[styles.upgradeButton, { backgroundColor: tier.color }]}
                  onPress={() => router.push("/tool/subscription" as never)}
                >
                  <Text style={styles.upgradeText}>Upgrade</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.manageButton, { borderColor: colors.border }]}
                  onPress={() => router.push("/tool/subscription" as never)}
                >
                  <Text style={[styles.manageText, { color: colors.muted }]}>Manage</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Credits value */}
            <View style={styles.creditsValueRow}>
              <Text style={[styles.creditsValue, { color: colors.foreground }]}>
                {creditsData?.isUnlimited ? "∞" : (creditsData?.credits ?? 0).toLocaleString()}
              </Text>
              <Text style={[styles.creditsLabel, { color: colors.muted }]}>
                {creditsData?.isUnlimited ? "Unlimited Credits" : "credits remaining"}
              </Text>
            </View>

            {/* Progress bar */}
            {!creditsData?.isUnlimited && (
              <View style={[styles.progressTrack, { backgroundColor: colors.surface2 }]}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${creditPct}%` as any, backgroundColor: creditPct > 20 ? tier.color : "#EF4444" },
                  ]}
                />
              </View>
            )}
          </View>

          {/* ── Platform Stats ─────────────────────────────────────────────── */}
          <View style={styles.statsRow}>
            {PLATFORM_STATS.map((stat) => (
              <View key={stat.label} style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.statValue, { color: colors.foreground }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* ── Quick Actions ──────────────────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
            <View style={styles.quickGrid}>
              {QUICK_TOOLS.map((tool) => {
                const locked = !canUseTool(tool.minTier);
                return (
                  <TouchableOpacity
                    key={tool.id}
                    style={[
                      styles.quickCard,
                      { backgroundColor: colors.surface, borderColor: colors.border, opacity: locked ? 0.55 : 1 },
                    ]}
                    onPress={() => openQuickTool(tool)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.quickIconWrap, { backgroundColor: tool.color + "20" }]}>
                      <HollywoodIcon tool={tool.toolIcon} size={26} />
                    </View>
                    <Text style={[styles.quickLabel, { color: colors.foreground }]}>{tool.label}</Text>
                    {locked && (
                      <Text style={[styles.quickLock, { color: colors.muted }]}>🔒</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Recent Projects ────────────────────────────────────────────── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Projects</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/projects" as never)}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>See all →</Text>
              </TouchableOpacity>
            </View>

            {recentProjects.length === 0 ? (
              <TouchableOpacity
                style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => router.push("/(tabs)/projects" as never)}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyIcon}>🎬</Text>
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Start Your First Film</Text>
                <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
                  Create a project and bring your vision to life with AI
                </Text>
                <View style={[styles.emptyButton, { backgroundColor: colors.primary }]}>
                  <Text style={styles.emptyButtonText}>New Project</Text>
                </View>
              </TouchableOpacity>
            ) : (
              recentProjects.map((project) => (
                <TouchableOpacity
                  key={project.id}
                  style={[styles.projectCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => router.push(`/project/${project.id}` as never)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.projectThumb, { backgroundColor: colors.surface2 }]}>
                    <Text style={styles.projectThumbIcon}>🎬</Text>
                  </View>
                  <View style={styles.projectInfo}>
                    <Text style={[styles.projectTitle, { color: colors.foreground }]} numberOfLines={1}>
                      {project.title}
                    </Text>
                    <Text style={[styles.projectMeta, { color: colors.muted }]}>
                      {project.genre || "No genre"} · {project.status}
                    </Text>
                  </View>
                  <Text style={[styles.projectArrow, { color: colors.muted }]}>›</Text>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* ── All Tools CTA ──────────────────────────────────────────────── */}
          <TouchableOpacity
            style={[styles.allToolsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push("/tool/all-tools" as never)}
            activeOpacity={0.8}
          >
            <View>
              <Text style={[styles.allToolsTitle, { color: colors.foreground }]}>All Production Tools</Text>
              <Text style={[styles.allToolsSubtitle, { color: colors.muted }]}>
                30+ AI tools for every stage of filmmaking
              </Text>
            </View>
            <Text style={[styles.allToolsArrow, { color: colors.primary }]}>→</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  greeting: { fontSize: 13 },
  userName: { fontSize: 22, fontWeight: "800", marginTop: 2 },
  headerLogo: { width: 38, height: 38 },

  content: { padding: 20, gap: 24 },

  // Credits card
  creditsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  creditsTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tierBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  tierDot: { width: 7, height: 7, borderRadius: 4 },
  tierText: { fontSize: 12, fontWeight: "700" },
  upgradeButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  upgradeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  manageButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  manageText: { fontSize: 12, fontWeight: "600" },
  creditsValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  creditsValue: { fontSize: 32, fontWeight: "800" },
  creditsLabel: { fontSize: 13 },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  statValue: { fontSize: 16, fontWeight: "800" },
  statLabel: { fontSize: 10, textAlign: "center" },

  // Section
  section: { gap: 12 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { fontSize: 17, fontWeight: "700" },
  seeAll: { fontSize: 13 },

  // Quick grid
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  quickCard: {
    width: (SCREEN_WIDTH - 40 - 10) / 3 - 4,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
    gap: 8,
  },
  quickIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quickIcon: { fontSize: 22 },
  quickLabel: { fontSize: 11, fontWeight: "600", textAlign: "center" },
  quickLock: { fontSize: 10, marginTop: -4 },

  // Empty state
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 10,
  },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 17, fontWeight: "700" },
  emptySubtitle: { fontSize: 13, textAlign: "center" },
  emptyButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 4,
  },
  emptyButtonText: { color: "#fff", fontWeight: "700" },

  // Project card
  projectCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  projectThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  projectThumbIcon: { fontSize: 22 },
  projectInfo: { flex: 1 },
  projectTitle: { fontSize: 14, fontWeight: "700" },
  projectMeta: { fontSize: 12, marginTop: 2 },
  projectArrow: { fontSize: 20 },

  // All tools CTA
  allToolsCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  allToolsTitle: { fontSize: 15, fontWeight: "700" },
  allToolsSubtitle: { fontSize: 12, marginTop: 3 },
  allToolsArrow: { fontSize: 22 },
});
