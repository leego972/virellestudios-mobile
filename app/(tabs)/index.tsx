import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

const QUICK_TOOLS = [
  { id: "director-chat", label: "Director Chat", icon: "🎬", route: "/(tabs)/chat" },
  { id: "script-writer", label: "Script Writer", icon: "📝", route: "/tool/script-writer" },
  { id: "storyboard", label: "Storyboard", icon: "🖼️", route: "/tool/storyboard" },
  { id: "video-gen", label: "Video Gen", icon: "🎥", route: "/tool/video-generation" },
];

const SUBSCRIPTION_LABELS: Record<string, string> = {
  free: "Free",
  amateur: "Amateur",
  independent: "Independent",
  creator: "Creator",
  studio: "Studio",
  industry: "Industry",
};

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth({ autoFetch: true });
  const { data: creditsData } = trpc.credits.balance.useQuery();
  const { data: projects } = trpc.projects.list.useQuery();

  const recentProjects = projects?.slice(0, 3) ?? [];

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.greeting, { color: colors.muted }]}>Welcome back</Text>
            <Text style={[styles.userName, { color: colors.foreground }]}>
              {user?.name || "Director"}
            </Text>
          </View>
          <Image
            source={require("@/assets/images/icon.png")}
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.content}>
          {/* Credits Card */}
          <View style={[styles.creditsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.creditsLeft}>
              <Text style={[styles.creditsLabel, { color: colors.muted }]}>Credits Available</Text>
              <Text style={[styles.creditsValue, { color: colors.primary }]}>
                {creditsData?.isUnlimited ? "∞ Unlimited" : (creditsData?.credits ?? "—")}
              </Text>
              <View style={[styles.tierBadge, { backgroundColor: colors.primary + "20" }]}>
                <Text style={[styles.tierText, { color: colors.primary }]}>
                  {SUBSCRIPTION_LABELS[creditsData?.tier ?? "free"]} Plan
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/tool/subscription" as never)}
            >
              <Text style={styles.upgradeText}>Upgrade</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
            <View style={styles.quickGrid}>
              {QUICK_TOOLS.map((tool) => (
                <TouchableOpacity
                  key={tool.id}
                  style={[styles.quickCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => router.push(tool.route as never)}
                >
                  <Text style={styles.quickIcon}>{tool.icon}</Text>
                  <Text style={[styles.quickLabel, { color: colors.foreground }]}>{tool.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Recent Projects */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Projects</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/projects" as never)}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
              </TouchableOpacity>
            </View>

            {recentProjects.length === 0 ? (
              <TouchableOpacity
                style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => router.push("/(tabs)/projects" as never)}
              >
                <Text style={styles.emptyIcon}>🎬</Text>
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Start Your First Film</Text>
                <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
                  Create a project and bring your vision to life
                </Text>
              </TouchableOpacity>
            ) : (
              recentProjects.map((project) => (
                <TouchableOpacity
                  key={project.id}
                  style={[styles.projectCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => router.push(`/project/${project.id}` as never)}
                >
                  <View style={[styles.projectThumb, { backgroundColor: colors.surface2 }]}>
                    <Text style={styles.projectThumbIcon}>🎬</Text>
                  </View>
                  <View style={styles.projectInfo}>
                    <Text style={[styles.projectTitle, { color: colors.foreground }]} numberOfLines={1}>
                      {project.title}
                    </Text>
                    <Text style={[styles.projectGenre, { color: colors.muted }]}>
                      {project.genre || "No genre"} · {project.status}
                    </Text>
                  </View>
                  <Text style={[styles.projectArrow, { color: colors.muted }]}>›</Text>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* All Tools */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>All Production Tools</Text>
            <TouchableOpacity
              style={[styles.allToolsButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push("/tool/all-tools" as never)}
            >
              <Text style={[styles.allToolsText, { color: colors.foreground }]}>Browse All 30+ Tools →</Text>
            </TouchableOpacity>
          </View>
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
  userName: { fontSize: 20, fontWeight: "700", marginTop: 2 },
  headerLogo: { width: 36, height: 36 },
  content: { padding: 20, gap: 24 },
  creditsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  creditsLeft: { gap: 6 },
  creditsLabel: { fontSize: 12 },
  creditsValue: { fontSize: 28, fontWeight: "700" },
  tierBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  tierText: { fontSize: 11, fontWeight: "600" },
  upgradeButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  upgradeText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  section: { gap: 12 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 17, fontWeight: "700" },
  seeAll: { fontSize: 13 },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  quickCard: {
    width: "47%",
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  quickIcon: { fontSize: 28 },
  quickLabel: { fontSize: 13, fontWeight: "600", textAlign: "center" },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    padding: 32,
    alignItems: "center",
    gap: 8,
  },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 16, fontWeight: "600" },
  emptySubtitle: { fontSize: 13, textAlign: "center" },
  projectCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  projectThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  projectThumbIcon: { fontSize: 22 },
  projectInfo: { flex: 1 },
  projectTitle: { fontSize: 15, fontWeight: "600" },
  projectGenre: { fontSize: 12, marginTop: 2 },
  projectArrow: { fontSize: 20 },
  allToolsButton: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
  },
  allToolsText: { fontSize: 15, fontWeight: "600" },
});
