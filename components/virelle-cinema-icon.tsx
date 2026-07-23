import { Image } from "expo-image";
import React from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import {
  VIRELLE_CINEMA_FRAMES,
  VIRELLE_CINEMA_FRAME_SIZE,
  VIRELLE_CINEMA_SPRITE,
  VIRELLE_CINEMA_SPRITE_SIZE,
  type VirelleCinemaIconKey,
} from "@/constants/virelleCinemaIcons";

interface VirelleCinemaIconProps {
  icon: VirelleCinemaIconKey;
  size?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function VirelleCinemaIcon({
  icon,
  size = 32,
  style,
  accessibilityLabel,
}: VirelleCinemaIconProps) {
  const frame = VIRELLE_CINEMA_FRAMES[icon];
  const scale = size / VIRELLE_CINEMA_FRAME_SIZE;

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? `${icon.replace(/_/g, " ")} icon`}
      style={[
        styles.frame,
        {
          width: size,
          height: size,
          borderRadius: Math.max(4, size * 0.18),
        },
        style,
      ]}
    >
      <Image
        source={{ uri: VIRELLE_CINEMA_SPRITE }}
        contentFit="fill"
        cachePolicy="memory-disk"
        style={{
          position: "absolute",
          width: VIRELLE_CINEMA_SPRITE_SIZE.width * scale,
          height: VIRELLE_CINEMA_SPRITE_SIZE.height * scale,
          left: -frame.x * scale,
          top: -frame.y * scale,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: "hidden",
    backgroundColor: "#050505",
    shadowColor: "#D4AF37",
    shadowOpacity: 0.16,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
});

export default VirelleCinemaIcon;
