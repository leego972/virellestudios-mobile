import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function StoryboardScreen({ projectId }: { projectId?: number }) {
  const colors = useColors();
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [cameraAngle, setCameraAngle] = useState("Wide Shot");
  const [panelNumber, setPanelNumber] = useState(1);

  const { data: panels, refetch } = trpc.storyboard.list.useQuery({ projectId: projectId! }, { enabled: !!projectId });
  const generateMutation = trpc.storyboard.generatePanel.useMutation({
    onSuccess: () => { refetch(); setDescription(""); setPanelNumber(n => n + 1); },
    onError: (err) => Alert.alert("Error", err.message),
  });

  const ANGLES = ["Wide Shot", "Medium Shot", "Close-up", "Extreme Close-up", "Over-the-shoulder", "POV", "Aerial"];

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}><Text style={[styles.back, { color: colors.primary }]}>‹ Back</Text></TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Storyboard</Text>
        <View style={{ width: 48 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 40 }}>
        {panels && panels.length > 0 && (
          <View style={styles.panelsGrid}>
            {panels.map((panel) => (
              <View key={panel.id} style={[styles.panelCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.panelThumb, { backgroundColor: colors.surface2 }]}>
                  <Text style={styles.panelIcon}>🖼️</Text>
                  <Text style={[styles.panelNum, { color: colors.muted }]}>Panel {panel.panelNumber}</Text>
                </View>
                <Text style={[styles.panelDesc, { color: colors.foreground }]} numberOfLines={2}>{panel.description}</Text>
                <Text style={[styles.panelAngle, { color: colors.muted }]}>{panel.cameraAngle}</Text>
              </View>
            ))}
          </View>
        )}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.muted }]}>Panel {panelNumber} Description</Text>
          <TextInput style={[styles.textarea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]} placeholder="Describe what happens in this panel..." placeholderTextColor={colors.muted} value={description} onChangeText={setDescription} multiline numberOfLines={3} />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.muted }]}>Camera Angle</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {ANGLES.map(a => (
                <TouchableOpacity key={a} style={[styles.chip, { borderColor: colors.border }, cameraAngle === a && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setCameraAngle(a)}>
                  <Text style={[styles.chipText, { color: cameraAngle === a ? "#fff" : colors.foreground }]}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }, generateMutation.isPending && { opacity: 0.7 }]} onPress={() => { if (!description.trim() || !projectId) return; generateMutation.mutate({ projectId, panelNumber, description, cameraAngle }); }} disabled={generateMutation.isPending}>
          {generateMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Add Panel (5 credits)</Text>}
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5 },
  back: { fontSize: 16 }, title: { fontSize: 17, fontWeight: "600" },
  panelsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  panelCard: { width: "47%", borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  panelThumb: { height: 80, alignItems: "center", justifyContent: "center" },
  panelIcon: { fontSize: 24 }, panelNum: { fontSize: 11 },
  panelDesc: { fontSize: 12, padding: 8 }, panelAngle: { fontSize: 11, paddingHorizontal: 8, paddingBottom: 8 },
  fieldGroup: { gap: 8 }, label: { fontSize: 13, fontWeight: "500" },
  textarea: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 15, minHeight: 80, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13 },
  btn: { borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
