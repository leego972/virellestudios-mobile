/**
 * HollywoodBadge — renders a tier badge PNG image.
 * HollywoodIcon — renders the original Virelle cinema icon system.
 */
import React from "react";
import {
  Image,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { VirelleCinemaIcon } from "@/components/virelle-cinema-icon";
import {
  TIER_BADGE_IMAGES,
  TOOL_ICON_IMAGES,
  type TierBadgeKey,
  type ToolIconKey,
} from "@/constants/hollywoodIcons";
import { TOOL_TO_VIRELLE_CINEMA_ICON } from "@/constants/virelleCinemaIcons";

interface HollywoodBadgeProps {
  tier: TierBadgeKey;
  size?: number;
  style?: StyleProp<ImageStyle>;
}

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
  style?: StyleProp<ViewStyle>;
}

export function HollywoodIcon({ tool, size = 32, style }: HollywoodIconProps) {
  const cinemaIcon = TOOL_TO_VIRELLE_CINEMA_ICON[tool];
  if (cinemaIcon) {
    return (
      <VirelleCinemaIcon
        icon={cinemaIcon}
        size={size}
        style={style}
        accessibilityLabel={`${tool.replace(/_/g, " ")} icon`}
      />
    );
  }

  const source = TOOL_ICON_IMAGES[tool];
  if (!source) return null;
  return (
    <Image
      source={source}
      style={[{ width: size, height: size, resizeMode: "contain" }, style as StyleProp<ImageStyle>]}
      accessibilityLabel={`${tool} icon`}
    />
  );
}
