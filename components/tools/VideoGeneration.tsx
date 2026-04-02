import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator, Modal } from "react-native";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useCredits } from "@/hooks/use-credits";
import { CreditBadge } from "@/components/credit-badge";
import { trpc } from "@/lib/trpc";
import CinemaPlayer from "@/components/cinema-player";

const DURATIONS = [4, 8, 16, 30];
const CREDIT_COST_PER_SEC = 5;

export default function VideoGenerationScreen({ projectId }: { projectId?: number }) {
  const colors = useColors();
  const router = useRouter();
  const { canAfford, refetch: refetchCredits } = useCredits();

  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(4);
  const [type, setType] = useState<"clip" | "trailer" | "film">("clip");
  const [generatedVideoId, setGeneratedVideoId] = useState<number | null>(null);
  const [playerVideo, setPlayerVideo] = useState<{ videoUrl: string; prompt: string; duration: number } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cost = duration * CREDIT_COST_PER_SEC;

  const generateMutation = trpc.videos.generate.useMutation({
    onSuccess: (data) => {
      refetchCredits();
      setGeneratedVideoId(data.videoId as unknown as number);
    },
    onError: (err) => Alert.alert("Generation Failed", err.message),
  });

  const { data: projectVideos, refetch: refetchVideos } = trpc.videos.projectVideos.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId && !!generatedVideoId }
  );

  useEffect(() => {
    if (!generatedVideoId) return;
    pollRef.current = setInterval(() => { refetchVideos(); }, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [generatedVideoId]);

  useEffect(() => {
    if (!generatedVideoId || !projectVideos) return;
    const vid = (projectVideos as any[]).find((v) => v.id === generatedVideoId);
    if (vid?.status === "ready" && vid.videoUrl) {
      if (pollRef.current) clearInterval(pollRef.current);
      setPlayerVideo({ videoUrl: vid.videoUrl, prompt: vid.prompt, duration: vid.duration });
    } else if (vid?.status === "failed") {
      if (pollRef.current) clearInterval(pollRef.current);
      Alert.alert("Generation Failed", "The video could not be generated. Please try again.");
      setGeneratedVideoId(null);
    }
  }, [projectVideos, generatedVideoId]);

  const isPolling = !!generatedVideoId && !playerVideo;

  const handleGenerate = () => {
    if (!prompt.trim()) { Alert.alert("Required", "Enter a video prompt."); return; }
    if (!canAfford(cost, "Video Generation")) return;
    setPlayerVideo(null);
    setGeneratedVideoId(null);
    generateMutation.mutate({ prompt, duration, projectId, type });
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}><Text style={[styles.back, { color: colors.primary }]}>‹ Back</Text></TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Video Generation</Text>
        <CreditBadge cost={cost} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 40 }}>
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.muted }]}>Video Prompt</Text>
          <TextInput
            style={[styles.textarea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
            placeholder="A cinematic shot of a detective walking through rain-soaked streets at night..."
            placeholderTextColor={colors.muted}
            value={prompt}
            onChangeText={setPrompt}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.muted }]}>Duration</Text>
          <View style={styles.chipRow}>
            {DURATIONS.map(d => (
              <TouchableOpacity key={d} style={[styles.chip, { borderColor: colors.border }, duration === d && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setDuration(d)}>
                <Text style={[styles.chipText, { color: duration === d ? "#fff" : colors.foreground }]}>{d}s</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.muted }]}>Type</Text>
          <View style={styles.chipRow}>
            {(["clip", "trailer", "film"] as const).map(t => (
              <TouchableOpacity key={t} style={[styles.chip, { borderColor: colors.border }, type === t && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setType(t)}>
                <Text style={[styles.chipText, { color: type === t ? "#fff" : colors.foreground }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.costBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.costText, { color: colors.muted }]}>💳 Cost: <Text style={{ color: colors.primary, fontWeight: "700" }}>{cost} credits</Text> ({duration}s × {CREDIT_COST_PER_SEC} credits/s)</Text>
        </View>

        {isPolling && (
          <View style={[styles.pollingCard, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.pollingText, { color: colors.foreground }]}>Generating your video… checking every 5s</Text>
          </View>
        )}

        {playerVideo && (
          <TouchableOpacity style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.primary }]} onPress={() => setPlayerVideo(playerVideo)}>
            <Text style={styles.resultIcon}>▶️</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.resultTitle, { color: colors.foreground }]} numberOfLines={2}>{playerVideo.prompt}</Text>
              <Text style={[styles.resultMeta, { color: colors.muted }]}>{playerVideo.duration}s · Tap to play in CinemaPlayer</Text>
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.primary }, (generateMutation.isPending || isPolling) && { opacity: 0.6 }]}
          onPress={handleGenerate}
          disabled={generateMutation.isPending || isPolling}
        >
          {generateMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Generate Video · {cost} credits</Text>}
        </TouchableOpacity>
      </ScrollView>

      {playerVideo && (
        <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setPlayerVideo(null)}>
          <CinemaPlayer
            source={{ uri: playerVideo.videoUrl }}
            title={playerVideo.prompt}
            subtitle={`${playerVideo.duration}s · ${type}`}
            onClose={() => setPlayerVideo(null)}
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
  fieldGroup: { gap: 8 }, label: { fontSize: 13, fontWeight: "500" },
  textarea: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 15, minHeight: 100, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13 },
  costBox: { borderRadius: 10, borderWidth: 1, padding: 12 },
  costText: { fontSize: 13 },
  pollingCard: { borderRadius: 12, borderWidth: 1, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  pollingText: { fontSize: 14, flex: 1 },
  resultCard: { borderRadius: 12, borderWidth: 2, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  resultIcon: { fontSize: 32 },
  resultTitle: { fontSize: 14, fontWeight: "600" },
  resultMeta: { fontSize: 12, marginTop: 2 },
  btn: { borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
