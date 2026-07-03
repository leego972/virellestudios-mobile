import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator, Modal, Image } from "react-native";
  import { useState, useEffect, useRef } from "react";
  import * as ImagePicker from "expo-image-picker";
  import { useRouter } from "expo-router";
  import { ScreenContainer } from "@/components/screen-container";
  import { useColors } from "@/hooks/use-colors";
  import { useCredits } from "@/hooks/use-credits";
  import { CreditBadge } from "@/components/credit-badge";
  import { SwappysWatermark } from "@/components/swappys-watermark";
  import { trpc } from "@/lib/trpc";
  import CinemaPlayer from "@/components/cinema-player";

  export default function FilmGeneratorScreen({ projectId }: { projectId?: number }) {
    const colors = useColors();
    const router = useRouter();
    const { canAfford, refetch: refetchCredits } = useCredits();
    const [premise, setPremise] = useState("");
    const [genre, setGenre] = useState("Drama");
    const [duration, setDuration] = useState(30);
    const [referenceImage, setReferenceImage] = useState<string | null>(null);
    const [generatedVideoId, setGeneratedVideoId] = useState<number | null>(null);
    const [playerVideo, setPlayerVideo] = useState<{ videoUrl: string } | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const GENRES = ["Drama", "Thriller", "Comedy", "Horror", "Sci-Fi", "Romance", "Action"];
    const DURATIONS = [15, 30, 60, 90];
    const cost = duration <= 15 ? 5 : duration <= 45 ? 10 : duration <= 90 ? 15 : 20;

    const generateMutation = trpc.videos.generate.useMutation({
      onSuccess: (data) => { refetchCredits(); setGeneratedVideoId(data.videoId as unknown as number); },
      onError: (err) => Alert.alert("Error", err.message),
    });

    const { data: projectVideos, refetch: refetchVideos } = trpc.videos.projectVideos.useQuery(
      { projectId: projectId! },
      { enabled: !!projectId && !!generatedVideoId }
    );

    useEffect(() => {
      if (!generatedVideoId) return;
      pollRef.current = setInterval(() => { refetchVideos(); }, 8000);
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
        Alert.alert("Generation Failed", "The film could not be generated. Please try again.");
        setGeneratedVideoId(null);
      }
    }, [projectVideos, generatedVideoId]);

    const isPolling = !!generatedVideoId && !playerVideo;

    const pickReferenceImage = async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") { Alert.alert("Permission needed", "Allow photo library access to pick a reference image."); return; }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, allowsEditing: true });
      if (!result.canceled && result.assets[0]) setReferenceImage(result.assets[0].uri);
    };

    const handleGenerate = () => {
      if (!premise.trim()) { Alert.alert("Required", "Enter a film premise."); return; }
      if (!canAfford(cost, "Full Film Generator")) return;
      setPlayerVideo(null);
      setGeneratedVideoId(null);
      generateMutation.mutate({ prompt: `${genre} film: ${premise}`, duration, projectId, type: "film" });
    };

    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()}><Text style={[styles.back, { color: colors.primary }]}>‹ Back</Text></TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>Full Film Generator</Text>
          <CreditBadge cost={cost} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 40 }}>
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={styles.infoIcon}>🎦</Text>
            <Text style={[styles.infoTitle, { color: colors.foreground }]}>AI Full Film Generator</Text>
            <Text style={[styles.infoDesc, { color: colors.muted }]}>Generate a complete short film from just a premise. AI writes the script, creates storyboards, and produces the video automatically.</Text>
          </View>

          <View style={styles.fieldGroup}><Text style={[styles.label, { color: colors.muted }]}>Film Premise</Text><TextInput style={[styles.textarea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]} placeholder="A lonely lighthouse keeper discovers a mysterious signal from the deep sea..." placeholderTextColor={colors.muted} value={premise} onChangeText={setPremise} multiline numberOfLines={4} /></View>

          <View style={styles.fieldGroup}><Text style={[styles.label, { color: colors.muted }]}>Genre</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}><View style={styles.chipRow}>{GENRES.map(g => (<TouchableOpacity key={g} style={[styles.chip, { borderColor: colors.border }, genre === g && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setGenre(g)}><Text style={[styles.chipText, { color: genre === g ? "#fff" : colors.foreground }]}>{g}</Text></TouchableOpacity>))}</View></ScrollView></View>

          <View style={styles.fieldGroup}><Text style={[styles.label, { color: colors.muted }]}>Duration (seconds)</Text><View style={styles.chipRow}>{DURATIONS.map(d => (<TouchableOpacity key={d} style={[styles.chip, { borderColor: colors.border }, duration === d && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setDuration(d)}><Text style={[styles.chipText, { color: duration === d ? "#fff" : colors.foreground }]}>{d}s</Text></TouchableOpacity>))}</View></View>

          {/* Reference Image */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.muted }]}>Reference Image (optional)</Text>
            <TouchableOpacity style={[styles.uploadBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={pickReferenceImage}>
              {referenceImage ? (
                <Image source={{ uri: referenceImage }} style={styles.refThumb} resizeMode="cover" />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Text style={styles.uploadIcon}>🖼️</Text>
                  <Text style={[styles.uploadText, { color: colors.muted }]}>Tap to pick a reference image</Text>
                </View>
              )}
            </TouchableOpacity>
            {referenceImage && (
              <TouchableOpacity onPress={() => setReferenceImage(null)}><Text style={[styles.clearBtn, { color: colors.muted }]}>✕ Remove image</Text></TouchableOpacity>
            )}
          </View>

          <View style={[styles.costBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.costText, { color: colors.muted }]}>💳 Cost: <Text style={{ color: colors.primary, fontWeight: "700" }}>{cost} credits</Text> (video + script + storyboard)</Text>
          </View>

          {isPolling && (
            <View style={[styles.pollingCard, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
              <ActivityIndicator color={colors.primary} />
              <Text style={[styles.pollingText, { color: colors.foreground }]}>Generating your film… this may take several minutes</Text>
            </View>
          )}

          {playerVideo && (
            <TouchableOpacity style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.primary }]} onPress={() => setPlayerVideo(playerVideo)}>
              <Text style={styles.resultIcon}>🎦</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.resultTitle, { color: colors.foreground }]}>Film Ready!</Text>
                <Text style={[styles.resultMeta, { color: colors.muted }]}>{genre} · {duration}s · Tap to play</Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }, (generateMutation.isPending || isPolling) && { opacity: 0.6 }]} onPress={handleGenerate} disabled={generateMutation.isPending || isPolling}>
            {generateMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Generate Full Film · {cost} credits</Text>}
          </TouchableOpacity>

          {/* Upgrade to Virelle Studios */}
          <TouchableOpacity style={[styles.upgradeCard, { borderColor: "#d4af3760" }]} onPress={() => router.push("/tool/subscription" as never)}>
            <Text style={styles.upgradeIcon}>⭐</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.upgradeTitle, { color: "#d4af37" }]}>Upgrade to Virelle Studios</Text>
              <Text style={[styles.upgradeDesc, { color: colors.muted }]}>Remove watermark, unlock BYOK, get unlimited exports</Text>
            </View>
            <Text style={{ color: "#d4af37", fontSize: 16 }}>›</Text>
          </TouchableOpacity>
        </ScrollView>

        {playerVideo && (
          <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setPlayerVideo(null)}>
            <View style={{ flex: 1 }}>
              <CinemaPlayer source={{ uri: playerVideo.videoUrl }} title={premise || "Full Film"} subtitle={`${genre} · ${duration}s`} onClose={() => setPlayerVideo(null)} autoPlay />
              <SwappysWatermark />
            </View>
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
    textarea: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 15, minHeight: 100, textAlignVertical: "top" },
    chipRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
    chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 }, chipText: { fontSize: 13 },
    uploadBtn: { borderRadius: 12, borderWidth: 1, borderStyle: "dashed", overflow: "hidden", height: 120, justifyContent: "center", alignItems: "center" },
    uploadPlaceholder: { alignItems: "center", gap: 8 },
    uploadIcon: { fontSize: 28 },
    uploadText: { fontSize: 13 },
    refThumb: { width: "100%", height: 120 },
    clearBtn: { fontSize: 12, textAlign: "right", marginTop: 4 },
    costBox: { borderRadius: 10, borderWidth: 1, padding: 12 }, costText: { fontSize: 13 },
    pollingCard: { borderRadius: 12, borderWidth: 1, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
    pollingText: { fontSize: 14, flex: 1 },
    resultCard: { borderRadius: 12, borderWidth: 2, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
    resultIcon: { fontSize: 32 }, resultTitle: { fontSize: 14, fontWeight: "600" }, resultMeta: { fontSize: 12, marginTop: 2 },
    btn: { borderRadius: 14, paddingVertical: 16, alignItems: "center" }, btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
    upgradeCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, padding: 14, backgroundColor: "rgba(212,175,55,0.06)" },
    upgradeIcon: { fontSize: 22 },
    upgradeTitle: { fontSize: 14, fontWeight: "700" },
    upgradeDesc: { fontSize: 12, marginTop: 2 },
  });
  