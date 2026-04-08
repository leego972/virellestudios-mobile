/**
 * HollywoodBadge — renders a tier badge PNG image.
 * HollywoodIcon — renders a tool icon PNG image.
 *
 * Both use local bundled assets for offline/native support.
 */
import React from "react";
import { Image, ImageStyle, StyleProp } from "react-native";
import {
  TIER_BADGE_IMAGES,
  TOOL_ICON_IMAGES,
  TierBadgeKey,
  ToolIconKey,
} from "@/constants/hollywoodIcons";

interface HollywoodBadgeProps {
  tier: TierBadgeKey;
  size?: number;
  style?: StyleProp<ImageStyle>;
}

/**
 * Renders the Hollywood tier badge (Indie / Creator / Industry / New / Featured / Cinematic).
 */
export function HollywoodBadge({ tier, size = 32, style }: HollywoodBadgeProps) {
  const source = TIER_BADGE_IMAGES[tier];
  if (!source) return null;
  return (
    <Image
      source={source}
      style={[{ width: size, height: size, resizeMode: "contain" }, style]}
      accessibilityLabel={`${tier} badge`}
    />
  );
}

interface HollywoodIconProps {
  tool: ToolIconKey;
  size?: number;
  style?: StyleProp<ImageStyle>;
}

/**
 * Renders a Hollywood tool icon PNG.
 */
export function HollywoodIcon({ tool, size = 32, style }: HollywoodIconProps) {
  const source = TOOL_ICON_IMAGES[tool];
  if (!source) return null;
  return (
    <Image
      source={source}
      style={[{ width: size, height: size, resizeMode: "contain" }, style]}
      accessibilityLabel={`${tool} icon`}
    />
  );
}
