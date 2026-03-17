import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
const TIERS = [
  { id: "free", name: "Free", price: "$0/mo", credits: "100 credits", features: ["Basic AI tools", "1 project", "Community support"], color: "#6B7280" },
  { id: "amateur", name: "Amateur", price: "$500/mo", credits: "5,000 credits", features: ["All AI tools", "5 projects", "Script Writer", "Storyboard", "Email support"], color: "#8B5CF6" },
  { id: "independent", name: "Independent", price: "$1,500/mo", credits: "25,000 credits", features: ["All Amateur features", "Unlimited projects", "Video generation", "Shot list", "Priority support"], color: "#3B82F6" },
  { id: "creator", name: "Creator", price: "$3,000/mo", credits: "75,000 credits", features: ["All Independent features", "Team collaboration", "Budget estimator", "Continuity checker", "Dedicated support"], color: "#10B981" },
  { id: "studio", name: "Studio", price: "$15,000/mo", credits: "250,000 credits", features: ["All Creator features", "White-label exports", "API access", "Custom integrations", "SLA guarantee"], color: "#F59E0B" },
  { id: "industry", name: "Industry", price: "$50,000/mo", credits: "1,000,000 credits", features: ["All Studio features", "Unlimited everything", "Dedicated account manager", "Custom AI training", "On-site support"], color: "#EF4444" },
];
export default function SubscriptionScreen({ projectId }: { projectId?: number }) {
  const colors = useColors();
  const router = useRouter();
  const { data: creditsData } = trpc.credits.balance.useQuery();
  const upgradeMutation = trpc.subscription.upgrade.useMutation({
    onSuccess: () => Alert.alert("Success", "Subscription updated! Credits will be added shortly."),
    onError: (err) => Alert.alert("Error", err.message),
  });
  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}><Text style={[styles.back, { color: colors.primary }]}>‹ Back</Text></TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Subscription Plans</Text>
        <View style={{ width: 48 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Choose the plan that fits your production needs</Text>
        {TIERS.map(tier => {
          const isCurrent = creditsData?.tier === tier.id;
          return (
            <View key={tier.id} style={[styles.tierCard, { backgroundColor: colors.surface, borderColor: isCurrent ? tier.color : colors.border }, isCurrent && { borderWidth: 2 }]}>
              <View style={styles.tierHeader}>
                <View>
                  <Text style={[styles.tierName, { color: tier.color }]}>{tier.name}</Text>
                  <Text style={[styles.tierPrice, { color: colors.foreground }]}>{tier.price}</Text>
                  <Text style={[styles.tierCredits, { color: colors.muted }]}>{tier.credits}</Text>
                </View>
                {isCurrent ? (
                  <View style={[styles.currentBadge, { backgroundColor: tier.color + "20" }]}><Text style={[styles.currentText, { color: tier.color }]}>Current</Text></View>
                ) : (
                  <TouchableOpacity style={[styles.selectBtn, { backgroundColor: tier.color }]} onPress={() => upgradeMutation.mutate({ tier: tier.id })} disabled={upgradeMutation.isPending}>
                    <Text style={styles.selectBtnText}>Select</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              {tier.features.map(f => (
                <View key={f} style={styles.featureRow}>
                  <Text style={[styles.featureCheck, { color: tier.color }]}>✓</Text>
                  <Text style={[styles.featureText, { color: colors.foreground }]}>{f}</Text>
                </View>
              ))}
            </View>
          );
        })}
      </ScrollView>
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5 },
  back: { fontSize: 16 }, title: { fontSize: 17, fontWeight: "600" },
  subtitle: { fontSize: 14, textAlign: "center" },
  tierCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  tierHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  tierName: { fontSize: 14, fontWeight: "700", textTransform: "uppercase" }, tierPrice: { fontSize: 20, fontWeight: "700" }, tierCredits: { fontSize: 12 },
  currentBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }, currentText: { fontSize: 12, fontWeight: "700" },
  selectBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }, selectBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  divider: { height: 0.5 },
  featureRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  featureCheck: { fontSize: 13, fontWeight: "700" }, featureText: { fontSize: 13, flex: 1 },
});
