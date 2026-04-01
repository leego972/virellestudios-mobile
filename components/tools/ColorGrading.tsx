import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

const LOOKS = ["Teal & Orange", "Bleach Bypass", "Cross Process", "Day for Night", "Golden Hour", "Desaturated", "High Contrast B&W", "Vintage Film", "Cyberpunk", "Natural"];
const REFERENCES = ["Blade Runner 2049", "The Godfather", "Mad Max: Fury Road", "Her", "Moonlight", "No Country for Old Men", "La La Land", "Parasite"];

export default function ColorGradingScreen({ projectId }: { projectId?: number }) {
  const colors = useColors();
  const router = useRouter();
  const [selectedLook, setSelectedLook] = useState("Teal & Orange");
  const [reference, setReference] = useState("");
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<{ palette: string[]; luts: string[]; settings: string; rationale: string } | null>(null);

  const generateMutation = trpc.colorGrading.generate.useMutation({
    onSuccess: (data) => setResult(data),
    onError: (err) => Alert.alert("Error", err.message),
  });

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.back, { color: colors.primary }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Color Grading</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 40 }}>
        {/* Result */}
        {result && (
          <View style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.resultTitle, { color: colors.foreground }]}>Color Grade Plan</Text>
            {result.palette && result.palette.length > 0 && (
              <View style={{ gap: 6 }}>
                <Text style={[styles.resultLabel, { color: colors.muted }]}>Palette</Text>
                <View style={styles.swatchRow}>
                  {result.palette.map((c, i) => (
                    <View key={i} style={[styles.swatch, { backgroundColor: c }]}>
                      <Text style={styles.swatchLabel}>{c}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            {result.luts && result.luts.length > 0 && (
              <View style={{ gap: 4 }}>
                <Text style={[styles.resultLabel, { color: colors.muted }]}>Recommended LUTs</Text>
                {result.luts.map((l, i) => (
                  <Text key={i} style={[styles.lutItem, { color: colors.foreground }]}>• {l}</Text>
                ))}
              </View>
            )}
            <View style={{ gap: 4 }}>
              <Text style={[styles.resultLabel, { color: colors.muted }]}>Settings Guide</Text>
              <Text style={[styles.resultText, { color: colors.foreground }]}>{result.settings}</Text>
            </View>
            <View style={{ gap: 4 }}>
              <Text style={[styles.resultLabel, { color: colors.muted }]}>Rationale</Text>
              <Text style={[styles.resultText, { color: colors.foreground }]}>{result.rationale}</Text>
            </View>
          </View>
        )}

        {/* Look selector */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.muted }]}>Color Look</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {LOOKS.map((l) => (
                <TouchableOpacity
                  key={l}
                  style={[styles.chip, { borderColor: colors.border }, selectedLook === l && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => setSelectedLook(l)}
                >
                  <Text style={[styles.chipText, { color: selectedLook === l ? "#fff" : colors.foreground }]}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Film reference */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.muted }]}>Film Reference (optional)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {REFERENCES.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.chip, { borderColor: colors.border }, reference === r && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => setReference(reference === r ? "" : r)}
                >
                  <Text style={[styles.chipText, { color: reference === r ? "#fff" : colors.foreground }]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Description */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.muted }]}>Film Description / Tone</Text>
          <TextInput
            style={[styles.textarea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
            placeholder="A neo-noir thriller set in a rain-soaked city. Dark, oppressive, with moments of neon warmth..."
            placeholderTextColor={colors.muted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.primary }, generateMutation.isPending && { opacity: 0.7 }]}
          onPress={() => {
            if (!description.trim()) { Alert.alert("Required", "Describe your film's tone."); return; }
            generateMutation.mutate({ projectId, look: selectedLook, reference, description });
          }}
          disabled={generateMutation.isPending}
        >
          {generateMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Generate Color Grade Plan (4 credits)</Text>
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
  resultCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 14 },
  resultTitle: { fontSize: 16, fontWeight: "700" },
  resultLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  swatchRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  swatch: { borderRadius: 8, padding: 8, minWidth: 80, alignItems: "center" },
  swatchLabel: { fontSize: 10, color: "#fff", fontWeight: "600", textShadowColor: "rgba(0,0,0,0.5)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  lutItem: { fontSize: 14 },
  resultText: { fontSize: 14, lineHeight: 21 },
  fieldGroup: { gap: 8 },
  label: { fontSize: 13, fontWeight: "500" },
  textarea: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 15, minHeight: 80, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13 },
  btn: { borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
