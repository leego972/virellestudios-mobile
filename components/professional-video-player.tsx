import { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { VideoView, useVideoPlayer, VideoSource } from "expo-video";
import { useColors } from "@/hooks/use-colors";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";

interface ProfessionalVideoPlayerProps {
  source: VideoSource;
  onClose?: () => void;
  title?: string;
  autoPlay?: boolean;
}

const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const SKIP_DURATION = 10; // seconds
const FRAME_DURATION = 1 / 24; // 24fps

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const frames = Math.floor((seconds % 1) * 24); // 24fps
  
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}:${String(frames).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}:${String(frames).padStart(2, "0")}`;
}

export default function ProfessionalVideoPlayer({
  source,
  onClose,
  title,
  autoPlay = false,
}: ProfessionalVideoPlayerProps) {
  const colors = useColors();
  const player = useVideoPlayer(source, (player) => {
    player.loop = false;
    player.muted = false;
    player.volume = 1.0;
    if (autoPlay) {
      player.play();
    }
  });

  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [isLoading, setIsLoading] = useState(true);

  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-hide controls after 3 seconds
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    setShowControls(true);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        setShowSpeedMenu(false);
      }, 3000);
    }
  }, [isPlaying]);

  // Update time and duration using event listeners
  useEffect(() => {
    if (!player) return;

    const statusListener = player.addListener('statusChange', (status) => {
      setDuration(player.duration);
      setIsLoading(status.status === 'loading');
    });

    const playingListener = player.addListener('playingChange', (payload) => {
      setIsPlaying(payload.isPlaying);
    });

    const timeListener = player.addListener('timeUpdate', (payload) => {
      setCurrentTime(payload.currentTime);
    });

    // Enable time updates every 100ms for smooth scrubbing
    player.timeUpdateEventInterval = 0.1;

    return () => {
      statusListener.remove();
      playingListener.remove();
      timeListener.remove();
    };
  }, [player]);

  // Handle playback end
  useEffect(() => {
    if (!player) return;

    const endListener = player.addListener('playToEnd', () => {
      if (isLooping) {
        player.currentTime = 0;
        player.play();
      } else {
        setIsPlaying(false);
      }
    });

    return () => endListener.remove();
  }, [player, isLooping]);

  const togglePlay = () => {
    if (player) {
      if (player.playing) {
        player.pause();
      } else {
        player.play();
      }
      resetControlsTimeout();
    }
  };

  const handleSeek = (value: number) => {
    if (player) {
      player.currentTime = value;
      setCurrentTime(value);
    }
  };

  const skipBackward = () => {
    if (player) {
      player.currentTime = Math.max(0, player.currentTime - SKIP_DURATION);
      resetControlsTimeout();
    }
  };

  const skipForward = () => {
    if (player) {
      player.currentTime = Math.min(duration, player.currentTime + SKIP_DURATION);
      resetControlsTimeout();
    }
  };

  const frameBackward = () => {
    if (player) {
      player.currentTime = Math.max(0, player.currentTime - FRAME_DURATION);
      resetControlsTimeout();
    }
  };

  const frameForward = () => {
    if (player) {
      player.currentTime = Math.min(duration, player.currentTime + FRAME_DURATION);
      resetControlsTimeout();
    }
  };

  const changeSpeed = (speed: number) => {
    if (player) {
      player.playbackRate = speed;
      setPlaybackSpeed(speed);
      setShowSpeedMenu(false);
      resetControlsTimeout();
    }
  };

  const toggleLoop = () => {
    if (player) {
      player.loop = !isLooping;
      setIsLooping(!isLooping);
      resetControlsTimeout();
    }
  };

  const toggleMute = () => {
    if (player) {
      player.muted = !isMuted;
      setIsMuted(!isMuted);
      resetControlsTimeout();
    }
  };

  const handleVolumeChange = (value: number) => {
    if (player) {
      player.volume = value;
      setVolume(value);
      if (value > 0 && isMuted) {
        player.muted = false;
        setIsMuted(false);
      }
    }
  };

  const handleScreenPress = () => {
    resetControlsTimeout();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      {showControls && (
        <View
          style={[
            styles.header,
            { backgroundColor: "rgba(0,0,0,0.7)", borderBottomColor: colors.border },
          ]}
        >
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          )}
          {title && (
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          )}
        </View>
      )}

      {/* Video Player */}
      <Pressable style={styles.videoContainer} onPress={handleScreenPress}>
        <VideoView
          style={styles.video}
          player={player}
          allowsFullscreen
          allowsPictureInPicture
          nativeControls={false}
          contentFit="contain"
        />

        {/* Loading Spinner */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        {/* Center Play Button */}
        {!isPlaying && showControls && !isLoading && (
          <View style={styles.centerPlayButton}>
            <TouchableOpacity
              style={[styles.playButtonCircle, { backgroundColor: "rgba(255,255,255,0.15)" }]}
              onPress={togglePlay}
            >
              <Ionicons name="play" size={48} color="#fff" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
        )}
      </Pressable>

      {/* Bottom Controls */}
      {showControls && (
        <View style={[styles.controls, { backgroundColor: "rgba(0,0,0,0.9)" }]}>
          {/* Timeline Scrubber */}
          <View style={styles.timelineContainer}>
            <Text style={[styles.timeText, { color: colors.muted }]}>
              {formatTime(currentTime)}
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={duration || 1}
              value={currentTime}
              onValueChange={handleSeek}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor="rgba(255,255,255,0.2)"
              thumbTintColor={colors.primary}
            />
            <Text style={[styles.timeText, { color: colors.muted }]}>
              {formatTime(duration)}
            </Text>
          </View>

          {/* Frame Stepping Controls */}
          <View style={styles.frameControls}>
            <Text style={[styles.sectionLabel, { color: colors.muted }]}>Frame Control</Text>
            <View style={styles.frameButtonsRow}>
              <TouchableOpacity
                style={[styles.frameButton, { backgroundColor: colors.surface }]}
                onPress={frameBackward}
              >
                <Ionicons name="play-skip-back" size={16} color={colors.foreground} />
                <Text style={[styles.frameButtonText, { color: colors.foreground }]}>
                  -1 Frame
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.frameButton, { backgroundColor: colors.surface }]}
                onPress={frameForward}
              >
                <Text style={[styles.frameButtonText, { color: colors.foreground }]}>
                  +1 Frame
                </Text>
                <Ionicons name="play-skip-forward" size={16} color={colors.foreground} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Main Playback Controls */}
          <View style={styles.mainControls}>
            {/* Skip Backward */}
            <TouchableOpacity style={styles.controlButton} onPress={skipBackward}>
              <Ionicons name="play-back" size={32} color="#fff" />
              <Text style={styles.skipLabel}>-10s</Text>
            </TouchableOpacity>

            {/* Play/Pause */}
            <TouchableOpacity
              style={[styles.playButton, { backgroundColor: colors.primary }]}
              onPress={togglePlay}
            >
              <Ionicons name={isPlaying ? "pause" : "play"} size={40} color="#fff" />
            </TouchableOpacity>

            {/* Skip Forward */}
            <TouchableOpacity style={styles.controlButton} onPress={skipForward}>
              <Ionicons name="play-forward" size={32} color="#fff" />
              <Text style={styles.skipLabel}>+10s</Text>
            </TouchableOpacity>
          </View>

          {/* Secondary Controls */}
          <View style={styles.secondaryControls}>
            {/* Volume */}
            <View style={styles.volumeControl}>
              <TouchableOpacity onPress={toggleMute} style={styles.iconButton}>
                <Ionicons
                  name={isMuted ? "volume-mute" : volume > 0.5 ? "volume-high" : "volume-low"}
                  size={24}
                  color="#fff"
                />
              </TouchableOpacity>
              <Slider
                style={styles.volumeSlider}
                minimumValue={0}
                maximumValue={1}
                value={isMuted ? 0 : volume}
                onValueChange={handleVolumeChange}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor="rgba(255,255,255,0.2)"
                thumbTintColor={colors.primary}
              />
            </View>

            {/* Speed Control */}
            <TouchableOpacity
              style={[
                styles.speedButton,
                { backgroundColor: playbackSpeed !== 1 ? colors.primary : colors.surface },
              ]}
              onPress={() => setShowSpeedMenu(!showSpeedMenu)}
            >
              <Text
                style={[
                  styles.speedText,
                  { color: playbackSpeed !== 1 ? "#fff" : colors.foreground },
                ]}
              >
                {playbackSpeed}x
              </Text>
            </TouchableOpacity>

            {/* Loop */}
            <TouchableOpacity
              style={[
                styles.iconButton,
                { backgroundColor: isLooping ? colors.primary : "transparent" },
              ]}
              onPress={toggleLoop}
            >
              <Ionicons name="repeat" size={24} color={isLooping ? "#fff" : colors.muted} />
            </TouchableOpacity>
          </View>

          {/* Speed Menu */}
          {showSpeedMenu && (
            <View style={[styles.speedMenu, { backgroundColor: colors.surface }]}>
              <Text style={[styles.speedMenuTitle, { color: colors.foreground }]}>
                Playback Speed
              </Text>
              {PLAYBACK_SPEEDS.map((speed) => (
                <TouchableOpacity
                  key={speed}
                  style={[
                    styles.speedMenuItem,
                    {
                      backgroundColor:
                        speed === playbackSpeed ? colors.primary : "transparent",
                    },
                  ]}
                  onPress={() => changeSpeed(speed)}
                >
                  <Text
                    style={[
                      styles.speedMenuItemText,
                      { color: speed === playbackSpeed ? "#fff" : colors.foreground },
                    ]}
                  >
                    {speed}x
                  </Text>
                  {speed === playbackSpeed && (
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === "ios" ? 50 : 12,
    borderBottomWidth: 0.5,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 12,
  },
  videoContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  centerPlayButton: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    pointerEvents: "none",
  },
  playButtonCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    pointerEvents: "auto",
  },
  controls: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === "ios" ? 32 : 12,
    gap: 16,
  },
  timelineContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeText: {
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    minWidth: 70,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  frameControls: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  frameButtonsRow: {
    flexDirection: "row",
    gap: 8,
  },
  frameButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  frameButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  mainControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
  },
  controlButton: {
    alignItems: "center",
    gap: 4,
  },
  skipLabel: {
    fontSize: 11,
    color: "#fff",
    fontWeight: "600",
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  volumeControl: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
  },
  volumeSlider: {
    flex: 1,
    height: 40,
  },
  speedButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: "center",
  },
  speedText: {
    fontSize: 14,
    fontWeight: "600",
  },
  speedMenu: {
    borderRadius: 12,
    padding: 8,
    gap: 4,
  },
  speedMenuTitle: {
    fontSize: 13,
    fontWeight: "600",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  speedMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  speedMenuItemText: {
    fontSize: 15,
    fontWeight: "500",
  },
});
