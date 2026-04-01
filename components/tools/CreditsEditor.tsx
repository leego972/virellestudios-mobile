import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

const SECTIONS = ["opening", "closing"] as const;
const ROLES = ["Director", "Producer", "Writer", "Cinematographer", "Editor", "Composer", "Lead Actor", "Supporting Actor", "Executive Producer", "Art Director", "Costume Designer", "Sound Designer", "VFX Supervisor"];

export default function CreditsEditorScreen({ projectId }: { projectId?: number }) {
  const colors = useColors();
  const router = useRouter();
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [section, setSection] = useState<"opening" | "closing">("closing");
  const [customRole, setCustomRole] = useState(false);

  const { data: creditsList, refetch } = trpc.credit.listByProject.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId, select: (data) => data as Array<{ id: number; role: string; name: string; characterName?: string | null; section?: string | null }> }
  );

  const createMutation = trpc.credit.create.useMutation({
    onSuccess: () => {
      refetch();
      setRole("");
      setName("");
      setCharacterName("");
    },
    onError: (err) => Alert.alert("Error", err.message),
  });

  const deleteMutation = trpc.credit.delete.useMutation({
    onSuccess: () => refetch(),
    onError: (err) => Alert.alert("Error", err.message),
  });

  const openingCredits = creditsList?.filter((c) => c.section === "opening") ?? [];
  const closingCredits = creditsList?.filter((c) => c.section === "closing") ?? [];

  const renderCreditItem = (c: { id: number; role: string; name: string; characterName?: string | null }) => (
    <View key={c.id} style={[styles.creditRow, { borderBottomColor: colors.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.creditRole, { color: colors.muted }]}>{c.role}</Text>
        <Text style={[styles.creditName, { color: colors.foreground }]}>{c.name}</Text>
        {c.characterName ? <Text style={[styles.creditChar, { color: colors.muted }]}>as {c.characterName}</Text> : null}
      </View>
      <TouchableOpacity
        style={[styles.deleteBtn, { borderColor: colors.border }]}
        onPress={() => Alert.alert("Remove", `Remove ${c.name}?`, [
          { text: "Cancel", style: "cancel" },
          { text: "Remove", style: "destructive", onPress: () => deleteMutation.mutate({ id: c.id }) },
        ])}
      >
        <Text style={{ color: "#ef4444", fontSize: 13 }}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.back, { color: colors.primary }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Credits Editor</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 40 }}>
        {/* Opening Credits */}
        {openingCredits.length > 0 && (
          <View style={[styles.creditsSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Opening Credits ({openingCredits.length})</Text>
            {openingCredits.map(renderCreditItem)}
          </View>
        )}

        {/* Closing Credits */}
        {closingCredits.length > 0 && (
          <View style={[styles.creditsSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Closing Credits ({closingCredits.length})</Text>
            {closingCredits.map(renderCreditItem)}
          </View>
        )}

        {/* Add Credit Form */}
        <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.formTitle, { color: colors.foreground }]}>Add Credit</Text>

          {/* Section toggle */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.muted }]}>Section</Text>
            <View style={styles.toggleRow}>
              {SECTIONS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.toggleBtn, { borderColor: colors.border }, section === s && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => setSection(s)}
                >
                  <Text style={[styles.toggleText, { color: section === s ? "#fff" : colors.foreground }]}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Role selector */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: colors.muted }]}>Role</Text>
              <TouchableOpacity onPress={() => setCustomRole(!customRole)}>
                <Text style={[styles.toggleLink, { color: colors.primary }]}>{customRole ? "Pick from list" : "Custom role"}</Text>
              </TouchableOpacity>
            </View>
            {customRole ? (
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
                placeholder="e.g. Gaffer, Key Grip..."
                placeholderTextColor={colors.muted}
                value={role}
                onChangeText={setRole}
              />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipRow}>
                  {ROLES.map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[styles.chip, { borderColor: colors.border }, role === r && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                      onPress={() => setRole(r)}
                    >
                      <Text style={[styles.chipText, { color: role === r ? "#fff" : colors.foreground }]}>{r}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>

          {/* Name */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.muted }]}>Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Full name..."
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Character name (optional) */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.muted }]}>Character Name (optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
              placeholder="as Detective Sarah..."
              placeholderTextColor={colors.muted}
              value={characterName}
              onChangeText={setCharacterName}
            />
          </View>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary }, createMutation.isPending && { opacity: 0.7 }]}
            onPress={() => {
              if (!role.trim() || !name.trim()) { Alert.alert("Required", "Enter both role and name."); return; }
              if (!projectId) { Alert.alert("No Project", "Open a project first."); return; }
              createMutation.mutate({ projectId, role, name, characterName: characterName || undefined, section });
            }}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Add to Credits</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5 },
  back: { fontSize: 16 },
  title: { fontSize: 17, fontWeight: "600" },
  creditsSection: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 4 },
  sectionTitle: { fontSize: 15, fontWeight: "700", marginBottom: 8 },
  creditRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 0.5 },
  creditRole: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  creditName: { fontSize: 15, fontWeight: "500" },
  creditChar: { fontSize: 12, fontStyle: "italic" },
  deleteBtn: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  formCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 16 },
  formTitle: { fontSize: 16, fontWeight: "700" },
  fieldGroup: { gap: 8 },
  labelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: 13, fontWeight: "500" },
  toggleLink: { fontSize: 13 },
  toggleRow: { flexDirection: "row", gap: 10 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  toggleText: { fontSize: 14, fontWeight: "500" },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 48, fontSize: 15 },
  chipRow: { flexDirection: "row", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13 },
  btn: { borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
