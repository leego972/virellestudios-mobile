import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTab } from "@/components/haptic-tab";
import { Platform, View, StyleSheet } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { HollywoodIcon } from "@/components/hollywood-badge";
import type { ToolIconKey } from "@/constants/hollywoodIcons";

/**
 * Custom tab bar icon wrapper using Hollywood branded tool icons.
 * Adds a subtle active indicator dot beneath the icon when focused.
 */
function TabIcon({
  tool,
  focused,
  size = 26,
}: {
  tool: ToolIconKey;
  focused: boolean;
  size?: number;
}) {
  const colors = useColors();
  return (
    <View style={styles.tabIconContainer}>
      <HollywoodIcon
        tool={tool}
        size={size}
        style={{ opacity: focused ? 1 : 0.45 }}
      />
      {focused && (
        <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />
      )}
    </View>
  );
}

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 60 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 10,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
          letterSpacing: 0.3,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabIcon tool="full_film_generator" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: "Projects",
          tabBarIcon: ({ focused }) => (
            <TabIcon tool="scene_builder" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Director",
          tabBarIcon: ({ focused }) => (
            <TabIcon tool="director_chat" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="movies"
        options={{
          title: "Movies",
          tabBarIcon: ({ focused }) => (
            <TabIcon tool="video_generation" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <TabIcon tool="settings" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    opacity: 0.8,
  },
});
