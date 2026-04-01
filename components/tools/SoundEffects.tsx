import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

const CATEGORIES = ["Ambient", "Action", "Foley", "Weather", "Crowd", "Nature", "Technology", "Horror", "Music Sting", "Transition"];

export default function SoundEffectsScreen({ projectId }: { projectId?: number }) {
  const colors = useColors();
  const router = useRouter();
  const [sceneDescription, setSceneDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Ambient");
  const [suggestions, setSuggestions] = useState<Array<{ name: string; category: string; description: string; timing: string; intensity: string }>>([]);

  const generateMutation = trpc.soundEffect.suggest.useMutation({
    onSuccess: (data) => {
      setSuggestions((prev) => [...(data.suggestions || []), ...prev]);
      setSceneDescription("");
    },
    onError: (err) => Alert.alert("Error", err.message),
  });

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.back, { color: colors.primary }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Sound Effects</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 40 }}>
        {/* Suggestions list */}
        {suggestions.length > 0 && (
          <View style={{ gap: 10 }}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Suggested SFX ({suggestions.length})</Text>
            {suggestions.map((s, i) => (
              <View key={i} style={[styles.sfxCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.sfxHeader}>
                  <Text style={[styles.sfxName, { color: colors.foreground }]}>{s.name}</Text>
                  <View style={[styles.categoryBadge, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "44" }]}>
                    <Text style={[styles.categoryText, { color: colors.primary }]}>{s.category}</Text>
                  </View>
                </View>
                <Text style={[styles.sfxDesc, { color: colors.muted }]}>{s.description}</Text>
                <View style={styles.sfxMeta}>
                  <Text style={[styles.sfxMetaText, { color: colors.muted }]}>Timing: {s.timing}</Text>
                  <Text style={[styles.sfxMetaText, { color: colors.muted }]}>Intensity: {s.intensity}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Category selector */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.muted }]}>SFX Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, { borderColor: colors.border }, selectedCategory === c && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => setSelectedCategory(c)}
                >
                  <Text style={[styles.chipText, { color: selectedCategory === c ? "#fff" : colors.foreground }]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Scene description */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.muted }]}>Scene Description</Text>
          <TextInput
            style={[styles.textarea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
            placeholder="A detective enters a dimly lit warehouse, footsteps echoing on wet concrete, distant dripping water..."
            placeholderTextColor={colors.muted}
            value={sceneDescription}
            onChangeText={setSceneDescription}
            multiline
            numberOfLines={4}
          />
        </View>

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.primary }, generateMutation.isPending && { opacity: 0.7 }]}
          onPress={() => {
            if (!sceneDescription.trim()) { Alert.alert("Required", "Describe the scene to get SFX suggestions."); return; }
            generateMutation.mutate({ projectId: projectId!, sceneDescription, category: selectedCategory });
          }}
          disabled={generateMutation.isPending}
        >
          {generateMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Suggest Sound Effects (3 credits)</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5 },
  back: { fontSize: 16 },
  title: { fontSize: 17, fontWeight: "600" },
  sectionTitle: { fontSize: 16, fontWeight: "600" },
  sfxCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 6 },
  sfxHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sfxName: { fontSize: 15, fontWeight: "600", flex: 1 },
  categoryBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  categoryText: { fontSize: 11, fontWeight: "600" },
  sfxDesc: { fontSize: 13, lineHeight: 19 },
  sfxMeta: { flexDirection: "row", gap: 16 },
  sfxMetaText: { fontSize: 12 },
  fieldGroup: { gap: 8 },
  label: { fontSize: 13, fontWeight: "500" },
  textarea: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 15, minHeight: 100, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13 },
  btn: { borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
