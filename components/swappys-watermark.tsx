import { View, Text, StyleSheet } from "react-native";

  interface SwappysWatermarkProps {
    visible?: boolean;
  }

  /**
   * SwappysWatermark — overlay shown on all Swappys video output.
   * Virelle Creator subscribers have watermark-free exports.
   */
  export function SwappysWatermark({ visible = true }: SwappysWatermarkProps) {
    if (!visible) return null;
    return (
      <View style={styles.container} pointerEvents="none">
        <View style={styles.pill}>
          <Text style={styles.text}>✦ Swappys</Text>
        </View>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: {
      position: "absolute",
      bottom: 16,
      right: 16,
      zIndex: 99,
      pointerEvents: "none",
    },
    pill: {
      backgroundColor: "rgba(0,0,0,0.65)",
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderWidth: 1,
      borderColor: "rgba(212,175,55,0.4)",
    },
    text: {
      color: "#d4af37",
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.5,
    },
  });
  