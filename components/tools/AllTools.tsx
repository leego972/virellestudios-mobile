import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
const ALL_TOOLS = [
  { id: "script-writer", label: "Script Writer", icon: "📝", category: "Writing", desc: "AI-generated screenplay from premise" },
  { id: "storyboard", label: "Storyboard", icon: "🖼️", category: "Visual", desc: "Visual panel-by-panel planning" },
  { id: "shot-list", label: "Shot List", icon: "📋", category: "Production", desc: "Camera shot breakdown" },
  { id: "video-generation", label: "Video Generation", icon: "🎥", category: "AI Video", desc: "Generate AI video clips" },
  { id: "trailer", label: "Trailer Generator", icon: "🎞️", category: "AI Video", desc: "Create a film trailer" },
  { id: "dialogue", label: "Dialogue Enhancer", icon: "💬", category: "Writing", desc: "Improve character dialogue" },
  { id: "budget", label: "Budget Estimator", icon: "💰", category: "Production", desc: "Production cost breakdown" },
  { id: "continuity", label: "Continuity Checker", icon: "🔍", category: "Analysis", desc: "Find script inconsistencies" },
  { id: "subtitles", label: "Subtitle Generator", icon: "📺", category: "Post-Production", desc: "Auto-generate SRT subtitles" },
  { id: "scene-builder", label: "Scene Builder", icon: "🎬", category: "Writing", desc: "Build individual scenes" },
  { id: "characters", label: "Characters", icon: "👥", category: "Production", desc: "Manage cast & characters" },
  { id: "team", label: "Team Collaboration", icon: "🤝", category: "Management", desc: "Invite collaborators" },
  { id: "film-generator", label: "Full Film Generator", icon: "🎦", category: "AI Video", desc: "Generate a complete short film" },
];
const CATEGORIES = ["All", "Writing", "Visual", "AI Video", "Production", "Analysis", "Post-Production", "Management"];
export default function AllToolsScreen({ projectId }: { projectId?: number }) {
  const colors = useColors();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const filtered = ALL_TOOLS.filter(t => (category === "All" || t.category === category) && (t.label.toLowerCase().includes(search.toLowerCase()) || t.desc.toLowerCase().includes(search.toLowerCase())));
  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}><Text style={[styles.back, { color: colors.primary }]}>‹ Back</Text></TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>All Tools</Text>
        <View style={{ width: 48 }} />
      </View>
      <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={{ color: colors.muted }}>🔍</Text>
        <TextInput style={[styles.searchInput, { color: colors.foreground }]} placeholder="Search tools..." placeholderTextColor={colors.muted} value={search} onChangeText={setSearch} />
      </View>
      <View style={styles.categoryScroll}>
        <FlatList horizontal data={CATEGORIES} keyExtractor={i => i} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }} renderItem={({ item }) => (
          <TouchableOpacity style={[styles.catChip, { borderColor: colors.border }, category === item && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setCategory(item)}>
            <Text style={[styles.catText, { color: category === item ? "#fff" : colors.foreground }]}>{item}</Text>
          </TouchableOpacity>
        )} />
      </View>
      <FlatList data={filtered} keyExtractor={t => t.id} contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 32 }} numColumns={2} columnWrapperStyle={{ gap: 10 }} renderItem={({ item }) => (
        <TouchableOpacity style={[styles.toolCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => router.push(`/tool/${item.id}${projectId ? `?projectId=${projectId}` : ""}` as never)}>
          <Text style={styles.toolIcon}>{item.icon}</Text>
          <Text style={[styles.toolLabel, { color: colors.foreground }]}>{item.label}</Text>
          <Text style={[styles.toolDesc, { color: colors.muted }]}>{item.desc}</Text>
          <View style={[styles.catBadge, { backgroundColor: colors.primary + "20" }]}><Text style={[styles.catBadgeText, { color: colors.primary }]}>{item.category}</Text></View>
        </TouchableOpacity>
      )} />
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5 },
  back: { fontSize: 16 }, title: { fontSize: 17, fontWeight: "600" },
  searchBox: { flexDirection: "row", alignItems: "center", margin: 16, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 44, gap: 8 },
  searchInput: { flex: 1, fontSize: 15 },
  categoryScroll: { marginBottom: 4 },
  catChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 }, catText: { fontSize: 13 },
  toolCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  toolIcon: { fontSize: 28 }, toolLabel: { fontSize: 14, fontWeight: "600" }, toolDesc: { fontSize: 11, lineHeight: 16 },
  catBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 4 }, catBadgeText: { fontSize: 10, fontWeight: "600" },
});
