import {
  View,
  Text,
  FlatList,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Image,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import CinemaPlayer from "@/components/cinema-player";
import { VideoView, useVideoPlayer } from "expo-video";

const STATUS_ICONS: Record<string, string> = {
  generating: "⏳",
  ready: "✅",
  failed: "❌",
  draft: "📝",
};

const TYPE_LABELS: Record<string, string> = {
  clip: "Clip",
  trailer: "Trailer",
  film: "Full Film",
  scene: "Scene",
};


const OPENER_URL = "https://virellestudios.com/virelle-opener.mp4";

type VideoItem = {
  id: number;
  prompt?: string;
  title?: string;
  type: string;
  duration?: number;
  status: string;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  sceneNumber?: number;
};

export default function MoviesScreen() {
  const colors = useColors();
  const router = useRouter();

  const { data: videos, isLoading: loadingVideos, refetch: refetchVideos } = trpc.videos.list.useQuery();
  const { data: scenes, isLoading: loadingScenes } = trpc.scenes.allWithVideo.useQuery();

  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [pendingVideo, setPendingVideo] = useState<VideoItem | null>(null);

  const isLoading = loadingVideos || loadingScenes;

    // Studio Opener: idle player, activated when a complete video is queued
    const openerPlayer = useVideoPlayer(null, (player) => {
      player.loop = false;
      player.muted = false;
    });

    useEffect(() => {
      if (!pendingVideo) return;
      openerPlayer.replace({ uri: OPENER_URL });
      openerPlayer.play();
      const listener = openerPlayer.addListener("playToEnd", () => {
        const video = pendingVideo;
        setPendingVideo(null);
        setSelectedVideo(video);
      });
      return () => { listener.remove(); };
    }, [pendingVideo]);
  

  // Scenes that have a ready video
  const sceneVideos: VideoItem[] = ((scenes as any[] | undefined) ?? [])
    .filter((s) => s.status === "ready" && s.videoUrl)
    .map((s) => ({
      id: s.id,
      title: s.title,
      type: "scene",
      duration: s.duration,
      status: s.status,
      videoUrl: s.videoUrl,
      thumbnailUrl: s.thumbnailUrl,
      sceneNumber: s.sceneNumber,
    }));

  const generatedVideos: VideoItem[] = ((videos as any[] | undefined) ?? []).map((v) => ({
    id: v.id,
    prompt: v.prompt,
    type: v.type ?? "clip",
    duration: v.duration,
    status: v.status,
    videoUrl: v.videoUrl,
    thumbnailUrl: v.thumbnailUrl,
  }));

  const sections = [
    ...(generatedVideos.length > 0 ? [{ title: "Generated Videos", data: generatedVideos }] : []),
    ...(sceneVideos.length > 0 ? [{ title: "Scene Videos", data: sceneVideos }] : []),
  ];

  const openPlayer = (item: VideoItem) => {
    if (item.status === "ready" && item.videoUrl) {
      const isCompleteVideo = item.type === "film" || item.type === "trailer" || item.type === "clip";
      if (isCompleteVideo) {
        setPendingVideo(item);
      } else {
        setSelectedVideo(item);
      }
    }
  };

  const renderVideoCard = ({ item }: { item: VideoItem }) => {
    const isReady = item.status === "ready" && !!item.videoUrl;
    const displayTitle = item.title ?? item.prompt ?? "Video";
    const subtitle = item.type === "scene"
      ? `Scene ${item.sceneNumber ?? ""}`
      : `${TYPE_LABELS[item.type] ?? item.type}${item.duration ? ` · ${item.duration}s` : ""}`;

    return (
      <TouchableOpacity
        style={[styles.videoCard, { backgroundColor: colors.surface, borderColor: isReady ? colors.border : colors.border }]}
        onPress={() => openPlayer(item)}
        disabled={!isReady}
        activeOpacity={isReady ? 0.7 : 1}
      >
        {/* Thumbnail */}
        <View style={styles.thumbContainer}>
          {item.thumbnailUrl ? (
            <Image source={{ uri: item.thumbnailUrl }} style={styles.videoThumb} resizeMode="cover" />
          ) : (
            <View style={[styles.videoThumbPlaceholder, { backgroundColor: colors.surface2 ?? colors.border }]}>
              <Text style={styles.videoThumbIcon}>
                {isReady ? "🎬" : STATUS_ICONS[item.status] ?? "🎬"}
              </Text>
            </View>
          )}
          {isReady && (
            <View style={styles.playOverlay}>
              <View style={[styles.playCircle, { backgroundColor: colors.primary }]}>
                <Text style={styles.playIcon}>▶</Text>
              </View>
            </View>
          )}
          {item.status === "generating" && (
            <View style={styles.playOverlay}>
              <ActivityIndicator color={colors.primary} />
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.videoInfo}>
          <Text style={[styles.videoPrompt, { color: colors.foreground }]} numberOfLines={2}>
            {displayTitle}
          </Text>
          <View style={styles.videoMeta}>
            <View style={[styles.typeBadge, { backgroundColor: colors.primary + "20" }]}>
              <Text style={[styles.typeText, { color: colors.primary }]}>
                {TYPE_LABELS[item.type] ?? item.type}
              </Text>
            </View>
            {item.duration ? (
              <Text style={[styles.duration, { color: colors.muted }]}>{item.duration}s</Text>
            ) : null}
            <Text style={[styles.status, { color: item.status === "ready" ? "#10B981" : item.status === "failed" ? colors.error : colors.muted }]}>
              {STATUS_ICONS[item.status]} {item.status}
            </Text>
          </View>
          <Text style={[styles.subtitle, { color: colors.muted }]}>{subtitle}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>My Movies</Text>
        <TouchableOpacity
          style={[styles.generateButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/tool/video-generation" as never)}
        >
          <Text style={styles.generateButtonText}>+ Generate</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : sections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🎥</Text>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Videos Yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
            Generate your first AI video from a project or prompt
          </Text>
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/tool/video-generation" as never)}
          >
            <Text style={styles.emptyButtonText}>Generate Video</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          contentContainerStyle={{ padding: 16, gap: 0, paddingBottom: 32 }}
          renderSectionHeader={({ section }) => (
            <Text style={[styles.sectionHeader, { color: colors.foreground }]}>{section.title}</Text>
          )}
          renderItem={renderVideoCard}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          SectionSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}

      {/* Studio Opener — plays before complete videos (film, trailer, clip) */}
      {pendingVideo && (
        <Modal
          visible={true}
          animationType="fade"
          presentationStyle="fullScreen"
          onRequestClose={() => { const v = pendingVideo; setPendingVideo(null); setSelectedVideo(v); }}
        >
          <View style={styles.openerContainer}>
            <VideoView
              player={openerPlayer}
              style={styles.openerVideo}
              contentFit="cover"
              nativeControls={false}
              allowsFullscreen={false}
            />
            <TouchableOpacity
              style={styles.openerSkip}
              onPress={() => { const v = pendingVideo; setPendingVideo(null); setSelectedVideo(v); }}
            >
              <Text style={styles.openerSkipText}>Skip ›</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      )}

      {/* CinemaPlayer Modal */}
      {selectedVideo && selectedVideo.videoUrl && (
        <Modal
          visible={true}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setSelectedVideo(null)}
        >
          <CinemaPlayer
            source={{ uri: selectedVideo.videoUrl }}
            title={selectedVideo.title ?? selectedVideo.prompt ?? "Video"}
            subtitle={selectedVideo.type === "scene"
              ? `Scene ${selectedVideo.sceneNumber ?? ""}`
              : `${TYPE_LABELS[selectedVideo.type] ?? selectedVideo.type}${selectedVideo.duration ? ` · ${selectedVideo.duration}s` : ""}`
            }
            onClose={() => setSelectedVideo(null)}
            autoPlay={true}
          />
        </Modal>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 0.5 },
  headerTitle: { fontSize: 28, fontWeight: "700" },
  generateButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  generateButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyContainer: { flex: 1, alignItems: "center", paddingTop: 80, gap: 12, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600" },
  emptySubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  emptyButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  emptyButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  sectionHeader: { fontSize: 16, fontWeight: "700", marginBottom: 10, marginTop: 4 },
  videoCard: { borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 12, overflow: "hidden" },
  thumbContainer: { position: "relative" },
  videoThumb: { width: 100, height: 80 },
  videoThumbPlaceholder: { width: 100, height: 80, alignItems: "center", justifyContent: "center" },
  videoThumbIcon: { fontSize: 28 },
  playOverlay: { position: "absolute", top: 0, left: 0, width: 100, height: 80, alignItems: "center", justifyContent: "center" },
  playCircle: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", opacity: 0.9 },
  playIcon: { color: "#fff", fontSize: 13, marginLeft: 2 },
  videoInfo: { flex: 1, paddingVertical: 10, paddingRight: 12, gap: 4 },
  videoPrompt: { fontSize: 14, fontWeight: "600", lineHeight: 20 },
  videoMeta: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeText: { fontSize: 11, fontWeight: "600" },
  duration: { fontSize: 12 },
  status: { fontSize: 12 },
  subtitle: { fontSize: 12 },
  openerContainer: { flex: 1, backgroundColor: "#000" },
  openerVideo: { flex: 1 },
  openerSkip: { position: "absolute", bottom: 40, right: 24, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
  openerSkipText: { color: "#fff", fontSize: 14, fontWeight: "600", letterSpacing: 0.5 },
});
