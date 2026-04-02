import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Modal } from "react-native";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useCredits } from "@/hooks/use-credits";
import { CreditBadge } from "@/components/credit-badge";
import { trpc } from "@/lib/trpc";
import CinemaPlayer from "@/components/cinema-player";

const TRAILER_COST = 50;

export default function TrailerScreen({ projectId }: { projectId?: number }) {
  const colors = useColors();
  const router = useRouter();
  const { canAfford, refetch: refetchCredits } = useCredits();
  const [style, setStyle] = useState("Dramatic");
  const [generatedVideoId, setGeneratedVideoId] = useState<number | null>(null);
  const [playerVideo, setPlayerVideo] = useState<{ videoUrl: string } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const STYLES = ["Dramatic", "Action", "Horror", "Comedy", "Romance", "Epic", "Mystery"];

  const generateMutation = trpc.trailer.generate.useMutation({
    onSuccess: (data) => {
      refetchCredits();
      setGeneratedVideoId(data.videoId as unknown as number);
    },
    onError: (err) => Alert.alert("Error", err.message),
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
      setPlayerVideo({ videoUrl: vid.videoUrl });
    } else if (vid?.status === "failed") {
      if (pollRef.current) clearInterval(pollRef.current);
      Alert.alert("Generation Failed", "The trailer could not be generated. Please try again.");
      setGeneratedVideoId(null);
    }
  }, [projectVideos, generatedVideoId]);

  const isPolling = !!generatedVideoId && !playerVideo;

  const handleGenerate = () => {
    if (!projectId) { Alert.alert("Required", "Select a project first."); return; }
    if (!canAfford(TRAILER_COST, "Trailer Generator")) return;
    setPlayerVideo(null);
    setGeneratedVideoId(null);
    generateMutation.mutate({ projectId, style });
  };
  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}><Text style={[styles.back, { color: colors.primary }]}>‹ Back</Text></TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Trailer Generator</Text>
        <CreditBadge cost={TRAILER_COST} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 40 }}>
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.infoIcon}>🎞️</Text>
          <Text style={[styles.infoTitle, { color: colors.foreground }]}>AI Trailer Generator</Text>
          <Text style={[styles.infoDesc, { color: colors.muted }]}>Generate a cinematic 90-second trailer for your film project using AI. The trailer will be assembled from your project's scenes and script.</Text>
        </View>
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.muted }]}>Trailer Style</Text>
          <View style={styles.chipGrid}>
            {STYLES.map(s => (
              <TouchableOpacity key={s} style={[styles.chip, { borderColor: colors.border }, style === s && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setStyle(s)}>
                <Text style={[styles.chipText, { color: style === s ? "#fff" : colors.foreground }]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={[styles.costBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.costText, { color: colors.muted }]}>💳 Cost: <Text style={{ color: colors.primary, fontWeight: "700" }}>50 credits</Text> · 90-second cinematic trailer</Text>
        </View>

        {isPolling && (
          <View style={[styles.pollingCard, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.pollingText, { color: colors.foreground }]}>Generating your trailer… checking every 5s</Text>
          </View>
        )}

        {playerVideo && (
          <TouchableOpacity style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.primary }]} onPress={() => setPlayerVideo(playerVideo)}>
            <Text style={styles.resultIcon}>🎞️</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.resultTitle, { color: colors.foreground }]}>Trailer Ready!</Text>
              <Text style={[styles.resultMeta, { color: colors.muted }]}>{style} style · Tap to play in CinemaPlayer</Text>
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.primary }, (generateMutation.isPending || isPolling) && { opacity: 0.6 }]}
          onPress={handleGenerate}
          disabled={generateMutation.isPending || isPolling}
        >
          {generateMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Generate Trailer · 50 credits</Text>}
        </TouchableOpacity>
      </ScrollView>

      {playerVideo && (
        <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setPlayerVideo(null)}>
          <CinemaPlayer
            source={{ uri: playerVideo.videoUrl }}
            title="Film Trailer"
            subtitle={`${style} style`}
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
  infoCard: { borderRadius: 16, borderWidth: 1, padding: 20, alignItems: "center", gap: 8 },
  infoIcon: { fontSize: 40 }, infoTitle: { fontSize: 18, fontWeight: "700" }, infoDesc: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  fieldGroup: { gap: 8 }, label: { fontSize: 13, fontWeight: "500" },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13 },
  costBox: { borderRadius: 10, borderWidth: 1, padding: 12 }, costText: { fontSize: 13 },
  pollingCard: { borderRadius: 12, borderWidth: 1, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  pollingText: { fontSize: 14, flex: 1 },
  resultCard: { borderRadius: 12, borderWidth: 2, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  resultIcon: { fontSize: 32 },
  resultTitle: { fontSize: 14, fontWeight: "600" },
  resultMeta: { fontSize: 12, marginTop: 2 },
  btn: { borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
