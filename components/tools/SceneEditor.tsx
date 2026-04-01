import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator, FlatList } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

const TIMES = ["Day", "Night", "Dawn", "Dusk", "Interior", "Exterior"];
const STATUSES = ["draft", "generating", "ready", "failed"] as const;

const STATUS_COLORS: Record<string, string> = {
  draft: "#6b7280",
  generating: "#f59e0b",
  ready: "#10b981",
  failed: "#ef4444",
};

export default function SceneEditorScreen({ projectId }: { projectId?: number }) {
  const colors = useColors();
  const router = useRouter();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [timeOfDay, setTimeOfDay] = useState("Day");
  const [showForm, setShowForm] = useState(false);

  const { data: scenes, refetch } = trpc.scenes.list.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );

  const createMutation = trpc.scenes.create.useMutation({
    onSuccess: () => { refetch(); resetForm(); },
    onError: (err) => Alert.alert("Error", err.message),
  });

  const updateMutation = trpc.scenes.update.useMutation({
    onSuccess: () => { refetch(); resetForm(); },
    onError: (err) => Alert.alert("Error", err.message),
  });

  const deleteMutation = trpc.scenes.delete.useMutation({
    onSuccess: () => refetch(),
    onError: (err) => Alert.alert("Error", err.message),
  });

  const generateMutation = trpc.scenes.generateDescription.useMutation({
    onSuccess: (data) => setDescription(data.description),
    onError: (err) => Alert.alert("Error", err.message),
  });

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setLocation("");
    setTimeOfDay("Day");
    setShowForm(false);
  }

  function startEdit(scene: { id: number; title: string; description?: string | null; location?: string | null; timeOfDay?: string | null }) {
    setEditingId(scene.id);
    setTitle(scene.title);
    setDescription(scene.description ?? "");
    setLocation(scene.location ?? "");
    setTimeOfDay(scene.timeOfDay ?? "Day");
    setShowForm(true);
  }

  function handleSave() {
    if (!title.trim()) { Alert.alert("Required", "Scene title is required."); return; }
    if (!projectId) { Alert.alert("No Project", "Open a project first."); return; }
    if (editingId) {
      updateMutation.mutate({ id: editingId, title, description, location, timeOfDay });
    } else {
      const nextNum = (scenes?.length ?? 0) + 1;
      createMutation.mutate({ projectId, title, description, location, timeOfDay, sceneNumber: nextNum });
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.back, { color: colors.primary }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Scene Editor</Text>
        <TouchableOpacity onPress={() => { resetForm(); setShowForm(true); }}>
          <Text style={[styles.addBtn, { color: colors.primary }]}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}>
        {/* Scene list */}
        {scenes && scenes.length > 0 && !showForm && (
          <View style={{ gap: 10 }}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Scenes ({scenes.length})</Text>
            {scenes.map((scene) => (
              <View key={scene.id} style={[styles.sceneCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.sceneCardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sceneNum, { color: colors.primary }]}>Scene {scene.sceneNumber}</Text>
                    <Text style={[styles.sceneTitle, { color: colors.foreground }]}>{scene.title}</Text>
                    {scene.location ? <Text style={[styles.sceneMeta, { color: colors.muted }]}>{scene.location} · {scene.timeOfDay}</Text> : null}
                  </View>
                  <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[scene.status] ?? "#6b7280" }]} />
                </View>
                {scene.description ? (
                  <Text style={[styles.sceneDesc, { color: colors.muted }]} numberOfLines={2}>{scene.description}</Text>
                ) : null}
                <View style={styles.sceneActions}>
                  <TouchableOpacity style={[styles.actionBtn, { borderColor: colors.border }]} onPress={() => startEdit(scene)}>
                    <Text style={[styles.actionText, { color: colors.foreground }]}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: "#ef4444" + "44" }]}
                    onPress={() => Alert.alert("Delete Scene", `Delete "${scene.title}"?`, [
                      { text: "Cancel", style: "cancel" },
                      { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate({ id: scene.id }) },
                    ])}
                  >
                    <Text style={[styles.actionText, { color: "#ef4444" }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Empty state */}
        {(!scenes || scenes.length === 0) && !showForm && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyIcon]}>🎬</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Scenes Yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.muted }]}>Add your first scene to start building your film structure.</Text>
            <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary, marginTop: 16 }]} onPress={() => setShowForm(true)}>
              <Text style={styles.btnText}>Add First Scene</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Add / Edit form */}
        {showForm && (
          <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.formTitle, { color: colors.foreground }]}>{editingId ? "Edit Scene" : "New Scene"}</Text>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.muted }]}>Scene Title</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                placeholder="The Warehouse Confrontation..."
                placeholderTextColor={colors.muted}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.muted }]}>Location</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                placeholder="INT. Abandoned Warehouse"
                placeholderTextColor={colors.muted}
                value={location}
                onChangeText={setLocation}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.muted }]}>Time of Day</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipRow}>
                  {TIMES.map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.chip, { borderColor: colors.border }, timeOfDay === t && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                      onPress={() => setTimeOfDay(t)}
                    >
                      <Text style={[styles.chipText, { color: timeOfDay === t ? "#fff" : colors.foreground }]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.muted }]}>Description</Text>
                <TouchableOpacity
                  onPress={() => {
                    if (!title.trim()) { Alert.alert("Required", "Enter a scene title first."); return; }
                    generateMutation.mutate({ title, location, timeOfDay, genre: undefined });
                  }}
                  disabled={generateMutation.isPending}
                >
                  <Text style={[styles.aiBtn, { color: colors.primary }]}>
                    {generateMutation.isPending ? "Generating..." : "AI Generate (2 credits)"}
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[styles.textarea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                placeholder="Describe what happens in this scene..."
                placeholderTextColor={colors.muted}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.formActions}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={resetForm}>
                <Text style={[styles.cancelText, { color: colors.foreground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary }, isSaving && { opacity: 0.7 }]}
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>{editingId ? "Save Changes" : "Add Scene"}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5 },
  back: { fontSize: 16 },
  title: { fontSize: 17, fontWeight: "600" },
  addBtn: { fontSize: 16, fontWeight: "600" },
  sectionTitle: { fontSize: 16, fontWeight: "600" },
  sceneCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  sceneCardHeader: { flexDirection: "row", alignItems: "flex-start" },
  sceneNum: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  sceneTitle: { fontSize: 16, fontWeight: "600" },
  sceneMeta: { fontSize: 12, marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  sceneDesc: { fontSize: 13, lineHeight: 19 },
  sceneActions: { flexDirection: "row", gap: 8 },
  actionBtn: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 6 },
  actionText: { fontSize: 13, fontWeight: "500" },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 20, fontWeight: "700" },
  emptySubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  formCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 16 },
  formTitle: { fontSize: 16, fontWeight: "700" },
  fieldGroup: { gap: 8 },
  labelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: 13, fontWeight: "500" },
  aiBtn: { fontSize: 13 },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 48, fontSize: 15 },
  textarea: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 15, minHeight: 100, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13 },
  formActions: { flexDirection: "row", gap: 10 },
  cancelBtn: { flex: 1, borderRadius: 12, borderWidth: 1, paddingVertical: 14, alignItems: "center" },
  cancelText: { fontSize: 15, fontWeight: "500" },
  saveBtn: { flex: 2, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  btn: { borderRadius: 14, paddingVertical: 16, paddingHorizontal: 24, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  background: {},
});
