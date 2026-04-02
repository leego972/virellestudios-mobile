import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator, Modal, Image } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import CinemaPlayer from "@/components/cinema-player";

export default function SceneBuilderScreen({ projectId }: { projectId?: number }) {
  const colors = useColors();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [timeOfDay, setTimeOfDay] = useState("Day");
  const [playerScene, setPlayerScene] = useState<{ videoUrl: string; title: string } | null>(null);

  const { data: scenes, refetch } = trpc.scenes.list.useQuery({ projectId: projectId! }, { enabled: !!projectId });
  const createMutation = trpc.scenes.create.useMutation({
    onSuccess: () => { refetch(); setTitle(""); setDescription(""); setLocation(""); },
    onError: (err) => Alert.alert("Error", err.message),
  });
  const TIMES = ["Day", "Night", "Dawn", "Dusk", "Interior", "Exterior"];

  const STATUS_COLORS: Record<string, string> = {
    draft: colors.muted,
    generating: "#F59E0B",
    ready: "#10B981",
    failed: colors.error,
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}><Text style={[styles.back, { color: colors.primary }]}>‹ Back</Text></TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Scene Builder</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 40 }}>
        {scenes && scenes.length > 0 && (
          <View style={styles.scenesList}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Scenes ({scenes.length})</Text>
            {(scenes as any[]).map((s) => (
              <View key={s.id} style={[styles.sceneCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {/* Thumbnail or placeholder */}
                {s.thumbnailUrl ? (
                  <Image source={{ uri: s.thumbnailUrl }} style={styles.sceneThumbnail} resizeMode="cover" />
                ) : (
                  <View style={[styles.sceneThumbnailPlaceholder, { backgroundColor: colors.border }]}>
                    <Text style={styles.sceneThumbnailIcon}>🎬</Text>
                  </View>
                )}
                <View style={styles.sceneInfo}>
                  <View style={styles.sceneTopRow}>
                    <Text style={[styles.sceneNum, { color: colors.primary }]}>Scene {s.sceneNumber}</Text>
                    <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[s.status] ?? colors.muted }]} />
                  </View>
                  <Text style={[styles.sceneTitle, { color: colors.foreground }]}>{s.title}</Text>
                  {s.location && <Text style={[styles.sceneMeta, { color: colors.muted }]}>{s.location} · {s.timeOfDay}</Text>}
                </View>
                {/* Play button — only shown when video is ready */}
                {s.status === "ready" && s.videoUrl && (
                  <TouchableOpacity
                    style={[styles.playBtn, { backgroundColor: colors.primary }]}
                    onPress={() => setPlayerScene({ videoUrl: s.videoUrl, title: s.title })}
                  >
                    <Text style={styles.playBtnIcon}>▶</Text>
                  </TouchableOpacity>
                )}
                {s.status === "generating" && (
                  <ActivityIndicator color={colors.primary} style={{ marginLeft: 8 }} />
                )}
              </View>
            ))}
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Add New Scene</Text>
        <View style={styles.fieldGroup}><Text style={[styles.label, { color: colors.muted }]}>Scene Title</Text><TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]} placeholder="The Confrontation" placeholderTextColor={colors.muted} value={title} onChangeText={setTitle} /></View>
        <View style={styles.fieldGroup}><Text style={[styles.label, { color: colors.muted }]}>Location</Text><TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]} placeholder="Police precinct, interrogation room" placeholderTextColor={colors.muted} value={location} onChangeText={setLocation} /></View>
        <View style={styles.fieldGroup}><Text style={[styles.label, { color: colors.muted }]}>Time of Day</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}><View style={styles.chipRow}>{TIMES.map(t => (<TouchableOpacity key={t} style={[styles.chip, { borderColor: colors.border }, timeOfDay === t && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setTimeOfDay(t)}><Text style={[styles.chipText, { color: timeOfDay === t ? "#fff" : colors.foreground }]}>{t}</Text></TouchableOpacity>))}</View></ScrollView></View>
        <View style={styles.fieldGroup}><Text style={[styles.label, { color: colors.muted }]}>Description</Text><TextInput style={[styles.textarea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]} placeholder="What happens in this scene..." placeholderTextColor={colors.muted} value={description} onChangeText={setDescription} multiline numberOfLines={3} /></View>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.primary }, createMutation.isPending && { opacity: 0.7 }]}
          onPress={() => {
            if (!title.trim() || !projectId) { Alert.alert("Required", "Enter a scene title and select a project."); return; }
            createMutation.mutate({ projectId, title, description, location, timeOfDay, sceneNumber: (scenes?.length ?? 0) + 1 });
          }}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Add Scene</Text>}
        </TouchableOpacity>
      </ScrollView>

      {playerScene && (
        <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setPlayerScene(null)}>
          <CinemaPlayer
            source={{ uri: playerScene.videoUrl }}
            title={playerScene.title}
            subtitle="Scene Preview"
            onClose={() => setPlayerScene(null)}
            autoPlay
          />
        </Modal>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5 },
  back: { fontSize: 16 }, title: { fontSize: 17, fontWeight: "600" },
  scenesList: { gap: 10 }, sectionTitle: { fontSize: 16, fontWeight: "600" },
  sceneCard: { borderRadius: 12, borderWidth: 1, flexDirection: "row", alignItems: "center", overflow: "hidden" },
  sceneThumbnail: { width: 72, height: 54 },
  sceneThumbnailPlaceholder: { width: 72, height: 54, alignItems: "center", justifyContent: "center" },
  sceneThumbnailIcon: { fontSize: 22 },
  sceneInfo: { flex: 1, padding: 10, gap: 2 },
  sceneTopRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  sceneNum: { fontSize: 11, fontWeight: "700" },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  sceneTitle: { fontSize: 14, fontWeight: "600" }, sceneMeta: { fontSize: 12 },
  playBtn: { width: 40, height: 54, alignItems: "center", justifyContent: "center" },
  playBtnIcon: { color: "#fff", fontSize: 16 },
  fieldGroup: { gap: 8 }, label: { fontSize: 13, fontWeight: "500" },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 48, fontSize: 15 },
  textarea: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 15, minHeight: 80, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", gap: 8 }, chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 }, chipText: { fontSize: 13 },
  btn: { borderRadius: 14, paddingVertical: 16, alignItems: "center" }, btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
