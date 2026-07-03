import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator, Modal, Image } from "react-native";
import { useState, useEffect, useRef } from "react";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useCredits } from "@/hooks/use-credits";
import { CreditBadge } from "@/components/credit-badge";
import { trpc } from "@/lib/trpc";
import CinemaPlayer from "@/components/cinema-player";
import { SwappysWatermark } from "@/components/swappys-watermark";

const DURATIONS = [4, 8, 16, 30];
const CREDIT_COST_PER_SEC = 5;

export default function VideoGenerationScreen({ projectId }: { projectId?: number }) {
  const colors = useColors();
  const router = useRouter();
  const { canAfford, refetch: refetchCredits } = useCredits();

  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(4);
  const [type, setType] = useState<"clip" | "trailer" | "film">("clip");
    const [sourceImage, setSourceImage] = useState<string | null>(null);
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

  const pickSourceImage = async () => {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== "granted") { Alert.alert("Permission needed", "Allow photo library access to pick a source image."); return; }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, allowsEditing: true });
      if (!result.canceled && result.assets[0]) setSourceImage(result.assets[0].uri);
    };

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

        {/* Source Image */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.muted }]}>Source Image — image-to-video (optional)</Text>
            <TouchableOpacity style={[styles.uploadBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={pickSourceImage}>
              {sourceImage
                ? <Image source={{ uri: sourceImage }} style={styles.refThumb} resizeMode="cover" />
                : <View style={styles.uploadPlaceholder}><Text style={styles.uploadIcon}>🎞️</Text><Text style={[styles.uploadText, { color: colors.muted }]}>Tap to pick a source image</Text></View>}
            </TouchableOpacity>
            {sourceImage && <TouchableOpacity onPress={() => setSourceImage(null)}><Text style={[styles.clearBtn, { color: colors.muted }]}>✕ Remove</Text></TouchableOpacity>}
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
        <TouchableOpacity style={[styles.upgradeCard, { borderColor: "#d4af3760" }]} onPress={() => router.push("/tool/subscription" as never)}>
            <Text style={styles.upgradeIcon}>⭐</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.upgradeTitle, { color: "#d4af37" }]}>Upgrade to Virelle Studios</Text>
              <Text style={[styles.upgradeDesc, { color: colors.muted }]}>Remove watermark · Unlock BYOK · Unlimited exports</Text>
            </View>
            <Text style={{ color: "#d4af37", fontSize: 16 }}>›</Text>
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
    uploadBtn: { borderRadius: 12, borderWidth: 1, borderStyle: "dashed", overflow: "hidden", height: 120, justifyContent: "center", alignItems: "center" },
    uploadPlaceholder: { alignItems: "center", gap: 8 }, uploadIcon: { fontSize: 28 }, uploadText: { fontSize: 13 },
    refThumb: { width: "100%", height: 120 }, clearBtn: { fontSize: 12, textAlign: "right", marginTop: 4 },
    upgradeCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, padding: 14, backgroundColor: "rgba(212,175,55,0.06)" },
    upgradeIcon: { fontSize: 22 }, upgradeTitle: { fontSize: 14, fontWeight: "700" }, upgradeDesc: { fontSize: 12, marginTop: 2 },
  });
