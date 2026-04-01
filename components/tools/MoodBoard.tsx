import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator, Image } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

const MOODS = ["Noir", "Epic", "Intimate", "Surreal", "Gritty", "Dreamy", "Tense", "Hopeful"];
const PALETTES = ["Warm", "Cool", "Desaturated", "High Contrast", "Pastel", "Monochrome"];

export default function MoodBoardScreen({ projectId }: { projectId?: number }) {
  const colors = useColors();
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [selectedMood, setSelectedMood] = useState("Noir");
  const [selectedPalette, setSelectedPalette] = useState("Cool");
  const [boards, setBoards] = useState<Array<{ prompt: string; mood: string; palette: string; description: string; colors: string[] }>>([]);

  const generateMutation = trpc.moodBoard.generate.useMutation({
    onSuccess: (data) => {
      setBoards((prev) => [{ prompt, mood: selectedMood, palette: selectedPalette, ...data }, ...prev]);
      setPrompt("");
    },
    onError: (err) => Alert.alert("Error", err.message),
  });

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.back, { color: colors.primary }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Mood Board</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 40 }}>
        {/* Saved boards */}
        {boards.length > 0 && (
          <View style={{ gap: 12 }}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your Mood Boards ({boards.length})</Text>
            {boards.map((b, i) => (
              <View key={i} style={[styles.boardCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.boardHeader}>
                  <Text style={[styles.boardMood, { color: colors.primary }]}>{b.mood} · {b.palette}</Text>
                </View>
                <Text style={[styles.boardPrompt, { color: colors.muted }]}>{b.prompt}</Text>
                <Text style={[styles.boardDesc, { color: colors.foreground }]}>{b.description}</Text>
                {b.colors && b.colors.length > 0 && (
                  <View style={styles.colorSwatches}>
                    {b.colors.map((c, ci) => (
                      <View key={ci} style={[styles.swatch, { backgroundColor: c }]} />
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Mood selector */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.muted }]}>Film Mood</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {MOODS.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.chip, { borderColor: colors.border }, selectedMood === m && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => setSelectedMood(m)}
                >
                  <Text style={[styles.chipText, { color: selectedMood === m ? "#fff" : colors.foreground }]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Palette selector */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.muted }]}>Color Palette</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {PALETTES.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.chip, { borderColor: colors.border }, selectedPalette === p && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => setSelectedPalette(p)}
                >
                  <Text style={[styles.chipText, { color: selectedPalette === p ? "#fff" : colors.foreground }]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Prompt input */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.muted }]}>Visual Reference Prompt</Text>
          <TextInput
            style={[styles.textarea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
            placeholder="A rain-soaked alleyway at midnight, neon reflections on wet pavement..."
            placeholderTextColor={colors.muted}
            value={prompt}
            onChangeText={setPrompt}
            multiline
            numberOfLines={3}
          />
        </View>

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.primary }, generateMutation.isPending && { opacity: 0.7 }]}
          onPress={() => {
            if (!prompt.trim()) { Alert.alert("Required", "Describe the visual mood you want."); return; }
            generateMutation.mutate({ projectId, prompt, mood: selectedMood, palette: selectedPalette });
          }}
          disabled={generateMutation.isPending}
        >
          {generateMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Generate Mood Board (4 credits)</Text>
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
  boardCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 8 },
  boardHeader: { flexDirection: "row", justifyContent: "space-between" },
  boardMood: { fontSize: 13, fontWeight: "600" },
  boardPrompt: { fontSize: 12, fontStyle: "italic" },
  boardDesc: { fontSize: 14, lineHeight: 20 },
  colorSwatches: { flexDirection: "row", gap: 6, marginTop: 4 },
  swatch: { width: 28, height: 28, borderRadius: 6 },
  fieldGroup: { gap: 8 },
  label: { fontSize: 13, fontWeight: "500" },
  textarea: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 15, minHeight: 80, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13 },
  btn: { borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
