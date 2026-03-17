import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

const GENRES = ["Drama", "Thriller", "Comedy", "Horror", "Sci-Fi", "Romance", "Action", "Documentary", "Animation"];
const STATUS_COLORS: Record<string, string> = {
  draft: "#6B7280",
  in_progress: "#F59E0B",
  completed: "#22C55E",
  archived: "#9CA3AF",
};

export default function ProjectsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [logline, setLogline] = useState("");
  const [search, setSearch] = useState("");

  const { data: projects, refetch, isLoading } = trpc.projects.list.useQuery();
  const createMutation = trpc.projects.create.useMutation({
    onSuccess: () => {
      setShowCreate(false);
      setTitle("");
      setGenre("");
      setLogline("");
      refetch();
    },
  });
  const deleteMutation = trpc.projects.delete.useMutation({ onSuccess: () => refetch() });

  const filtered = (projects ?? []).filter(
    (p) => p.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    if (!title.trim()) return;
    createMutation.mutate({ title: title.trim(), genre: genre || undefined, logline: logline || undefined });
  };

  const handleDelete = (id: number, title: string) => {
    Alert.alert("Delete Project", `Delete "${title}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate({ id }) },
    ]);
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Projects</Text>
        <TouchableOpacity
          style={[styles.newButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowCreate(true)}
        >
          <Text style={styles.newButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={{ color: colors.muted, marginRight: 8 }}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Search projects..."
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🎬</Text>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Projects Yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
                Create your first film project to get started
              </Text>
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowCreate(true)}
              >
                <Text style={styles.emptyButtonText}>Create Project</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.projectCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push(`/project/${item.id}` as never)}
              onLongPress={() => handleDelete(item.id, item.title)}
            >
              <View style={[styles.projectThumb, { backgroundColor: colors.surface2 }]}>
                <Text style={styles.projectThumbIcon}>🎬</Text>
              </View>
              <View style={styles.projectInfo}>
                <Text style={[styles.projectTitle, { color: colors.foreground }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[styles.projectGenre, { color: colors.muted }]}>
                  {item.genre || "No genre"}
                </Text>
                {item.logline ? (
                  <Text style={[styles.projectLogline, { color: colors.muted }]} numberOfLines={2}>
                    {item.logline}
                  </Text>
                ) : null}
              </View>
              <View style={styles.projectMeta}>
                <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[item.status] ?? "#6B7280") + "20" }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] ?? "#6B7280" }]}>
                    {item.status.replace("_", " ")}
                  </Text>
                </View>
                <Text style={[styles.arrow, { color: colors.muted }]}>›</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Create Modal */}
      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowCreate(false)}>
              <Text style={[styles.modalCancel, { color: colors.muted }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Project</Text>
            <TouchableOpacity onPress={handleCreate} disabled={!title.trim() || createMutation.isPending}>
              <Text style={[styles.modalSave, { color: title.trim() ? colors.primary : colors.muted }]}>
                {createMutation.isPending ? "Creating..." : "Create"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.muted }]}>Title *</Text>
              <TextInput
                style={[styles.fieldInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
                placeholder="My Film Project"
                placeholderTextColor={colors.muted}
                value={title}
                onChangeText={setTitle}
                autoFocus
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.muted }]}>Genre</Text>
              <View style={styles.genreGrid}>
                {GENRES.map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.genreChip,
                      { borderColor: colors.border },
                      genre === g && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => setGenre(genre === g ? "" : g)}
                  >
                    <Text style={[styles.genreText, { color: genre === g ? "#fff" : colors.foreground }]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.muted }]}>Logline</Text>
              <TextInput
                style={[styles.fieldTextarea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
                placeholder="A one-sentence summary of your film..."
                placeholderTextColor={colors.muted}
                value={logline}
                onChangeText={setLogline}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 0.5 },
  headerTitle: { fontSize: 28, fontWeight: "700" },
  newButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  newButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  searchContainer: { flexDirection: "row", alignItems: "center", margin: 16, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 44 },
  searchInput: { flex: 1, fontSize: 15 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyContainer: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600" },
  emptySubtitle: { fontSize: 14, textAlign: "center" },
  emptyButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  emptyButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  projectCard: { borderRadius: 14, borderWidth: 1, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  projectThumb: { width: 52, height: 52, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  projectThumbIcon: { fontSize: 24 },
  projectInfo: { flex: 1 },
  projectTitle: { fontSize: 15, fontWeight: "600" },
  projectGenre: { fontSize: 12, marginTop: 2 },
  projectLogline: { fontSize: 12, marginTop: 4, lineHeight: 16 },
  projectMeta: { alignItems: "flex-end", gap: 6 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: "600", textTransform: "capitalize" },
  arrow: { fontSize: 20 },
  modal: { flex: 1 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 0.5 },
  modalCancel: { fontSize: 16 },
  modalTitle: { fontSize: 17, fontWeight: "600" },
  modalSave: { fontSize: 16, fontWeight: "600" },
  modalContent: { padding: 20, gap: 20 },
  fieldGroup: { gap: 8 },
  fieldLabel: { fontSize: 13, fontWeight: "500" },
  fieldInput: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 48, fontSize: 15 },
  fieldTextarea: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, minHeight: 80 },
  genreGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  genreChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  genreText: { fontSize: 13 },
});
