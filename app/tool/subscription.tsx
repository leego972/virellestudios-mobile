/**
 * Subscription Management Screen
 *
 * Shows the user's current plan, credit balance, available tiers,
 * and top-up packs. Checkout is handled by opening the web Stripe
 * checkout in the system browser, then returning via deep link.
 */
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { getApiBaseUrl } from "@/constants/oauth";
import { HollywoodBadge } from "@/components/hollywood-badge";
import { SUBSCRIPTION_TIER_TO_BADGE, TierBadgeKey } from "@/constants/hollywoodIcons";

// ─── Tier metadata ────────────────────────────────────────────────────────────
// Three public tiers: Indie (indie), Creator (amateur), Industry (independent/creator/studio/industry)
const TIER_META: Record<string, { label: string; color: string; icon: string }> = {
  free:        { label: "Free",     color: "#6B7280", icon: "🆓" },
  indie:       { label: "Indie",    color: "#10B981", icon: "🎬" },
  amateur:     { label: "Creator",  color: "#F59E0B", icon: "🎨" },
  independent: { label: "Industry", color: "#8B5CF6", icon: "🏢" },
  creator:     { label: "Industry", color: "#8B5CF6", icon: "🏢" },  // alias
  studio:      { label: "Industry", color: "#8B5CF6", icon: "🏢" },  // alias
  industry:    { label: "Industry", color: "#8B5CF6", icon: "🏢" },
};

// ─── Tier display order (3 public tiers only) ────────────────────────────────
const TIER_ORDER = ["indie", "amateur", "independent"] as const;

// ─── Pricing display (AUD) ────────────────────────────────────────────────────
const TIER_PRICING: Record<string, { monthly: string; annual: string; credits: string; features: string[] }> = {
  indie: {
    monthly: "A$149/mo",
    annual: "A$1,490/yr",
    credits: "500 credits/mo",
    features: ["AI Script Writer & Screenplay Tools", "Character Creator & DNA Lock", "Director's AI Assistant", "Location Scout & Mood Board", "Shot List Generator", "Up to 2 projects", "720p export"],
  },
  amateur: {
    monthly: "A$490/mo",
    annual: "A$4,900/yr",
    credits: "2,000 credits/mo",
    features: ["Everything in Indie, plus:", "Video Generation (Runway, Sora, Kling, Veo)", "AI Voice Acting (3,000+ voices)", "AI Film Score (Suno v4)", "Up to 10 projects", "1080p export"],
  },
  independent: {
    monthly: "A$1,490/mo",
    annual: "A$14,900/yr",
    credits: "6,000 credits/mo",
    features: ["Everything in Creator, plus:", "Film Post-Production (ADR, Foley, Score, Mix)", "VFX Suite & Multi-Shot Sequencer", "4K + ProRes export", "Up to 25 projects", "5 team members"],
  },
};

// ─── Top-up pack display ──────────────────────────────────────────────────────
// Source of truth: virellestudios/server/_core/subscription.ts TOP_UP_PACKS
const TOP_UP_PACKS = [
  { id: "topup_10",   name: "Starter Pack",     credits: "100",    price: "A$19",   savings: "" },
  { id: "topup_50",   name: "Producer Pack",    credits: "300",    price: "A$49",   savings: "Save 16%" },
  { id: "topup_100",  name: "Director Pack",    credits: "750",    price: "A$99",   savings: "Save 32%" },
  { id: "topup_200",  name: "Filmmaker Pack",      credits: "2,000",  price: "A$199",  savings: "Save 47%" },
  { id: "topup_500",  name: "Blockbuster Pack", credits: "5,000",  price: "A$399",  savings: "Save 58%" },
  { id: "topup_1000", name: "Mogul Pack",       credits: "12,000", price: "A$799",  savings: "Save 63%" },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function SubscriptionScreen() {
  const colors = useColors();
  const router = useRouter();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [loadingTopup, setLoadingTopup] = useState<string | null>(null);
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");

  const { data: creditsData, refetch: refetchCredits } = trpc.credits.balance.useQuery();
  const createCheckout = trpc.subscription.createCheckout.useMutation();

  const currentTier = creditsData?.tier ?? "free";
  const currentMeta = TIER_META[currentTier] ?? TIER_META.free;
  const creditPct = creditsData?.isUnlimited
    ? 100
    : Math.min(100, Math.round(((creditsData?.credits ?? 0) / (creditsData?.totalCredits ?? 1)) * 100));

  // ─── Open Stripe checkout in system browser ───────────────────────────────
  const handleUpgrade = async (tierId: string) => {
    setLoadingTier(tierId);
    try {
      const baseUrl = getApiBaseUrl();
      // Use the web app's pricing page which handles the Stripe checkout
      // The mobile app's deep link scheme is used as the return URL
      const url = `${baseUrl.replace("/api", "")}/pricing?tier=${tierId}&billing=${billing}&source=mobile`;
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "Unable to open the billing page. Please try again.");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to open billing page.");
    } finally {
      setLoadingTier(null);
    }
  };

  // ─── Open top-up checkout ─────────────────────────────────────────────────
  const handleTopUp = async (packId: string) => {
    setLoadingTopup(packId);
    try {
      const baseUrl = getApiBaseUrl().replace("/api", "");
      const url = `${baseUrl}/pricing?pack=${packId}&source=mobile`;
      await Linking.openURL(url);
    } catch (err) {
      Alert.alert("Error", "Failed to open top-up page.");
    } finally {
      setLoadingTopup(null);
    }
  };

  // ─── Open billing portal ──────────────────────────────────────────────────
  const handleManageBilling = async () => {
    try {
      const baseUrl = getApiBaseUrl().replace("/api", "");
      await Linking.openURL(`${baseUrl}/billing/portal?source=mobile`);
    } catch {
      Alert.alert("Error", "Failed to open billing portal.");
    }
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={[styles.backText, { color: colors.muted }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>Subscription</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.content}>

          {/* ── Current Plan Card ──────────────────────────────────────────── */}
          <View style={[styles.currentPlanCard, { backgroundColor: colors.surface, borderColor: currentMeta.color + "50" }]}>
            <View style={styles.planTopRow}>
              <View style={[styles.planBadge, { backgroundColor: currentMeta.color + "20" }]}>
                {SUBSCRIPTION_TIER_TO_BADGE[currentTier] ? (
                  <HollywoodBadge tier={SUBSCRIPTION_TIER_TO_BADGE[currentTier] as TierBadgeKey} size={28} style={{ marginRight: 6 }} />
                ) : (
                  <Text style={styles.planIcon}>{currentMeta.icon}</Text>
                )}
                <Text style={[styles.planLabel, { color: currentMeta.color }]}>{currentMeta.label} Plan</Text>
              </View>
              {currentTier !== "free" && (
                <TouchableOpacity
                  style={[styles.manageBtn, { borderColor: colors.border }]}
                  onPress={handleManageBilling}
                >
                  <Text style={[styles.manageBtnText, { color: colors.muted }]}>Manage</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Credits */}
            <View style={styles.creditsRow}>
              <Text style={[styles.creditsValue, { color: colors.foreground }]}>
                {creditsData?.isUnlimited ? "∞" : (creditsData?.credits ?? 0).toLocaleString()}
              </Text>
              <Text style={[styles.creditsLabel, { color: colors.muted }]}>
                {creditsData?.isUnlimited ? "Unlimited Credits" : `of ${(creditsData?.totalCredits ?? 0).toLocaleString()} credits`}
              </Text>
            </View>

            {/* Progress bar */}
            {!creditsData?.isUnlimited && (
              <View style={[styles.progressTrack, { backgroundColor: colors.surface2 ?? colors.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${creditPct}%` as any,
                      backgroundColor: creditPct > 20 ? currentMeta.color : "#EF4444",
                    },
                  ]}
                />
              </View>
            )}

            {creditPct <= 20 && !creditsData?.isUnlimited && (
              <Text style={[styles.lowCreditsWarning, { color: "#EF4444" }]}>
                ⚠ Credits running low — top up to continue generating
              </Text>
            )}
          </View>

          {/* ── Billing Toggle ─────────────────────────────────────────────── */}
          <View style={[styles.billingToggle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.billingOption, billing === "monthly" && { backgroundColor: colors.foreground }]}
              onPress={() => setBilling("monthly")}
            >
              <Text style={[styles.billingOptionText, { color: billing === "monthly" ? colors.background : colors.muted }]}>
                Monthly
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.billingOption, billing === "annual" && { backgroundColor: colors.foreground }]}
              onPress={() => setBilling("annual")}
            >
              <Text style={[styles.billingOptionText, { color: billing === "annual" ? colors.background : colors.muted }]}>
                Annual
              </Text>
              <View style={styles.saveBadge}>
                <Text style={styles.saveBadgeText}>Save 17%</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* ── Tier Cards ─────────────────────────────────────────────────── */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Choose a Plan</Text>
          {TIER_ORDER.filter(t => TIER_PRICING[t]).map((tierId) => {
            const meta = TIER_META[tierId];
            const pricing = TIER_PRICING[tierId];
            // Collapse all Industry aliases to the canonical "independent" display tier
            const normalised = ["creator", "studio", "industry"].includes(currentTier) ? "independent" : currentTier;
            const isCurrent = tierId === normalised;
            const isLoading = loadingTier === tierId;

            return (
              <View
                key={tierId}
                style={[
                  styles.tierCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isCurrent ? meta.color : colors.border,
                    borderWidth: isCurrent ? 2 : 1,
                  },
                ]}
              >
                {/* Tier header */}
                <View style={styles.tierHeader}>
                  <View style={styles.tierTitleRow}>
                    {SUBSCRIPTION_TIER_TO_BADGE[tierId] ? (
                      <HollywoodBadge tier={SUBSCRIPTION_TIER_TO_BADGE[tierId] as TierBadgeKey} size={32} style={{ marginRight: 6 }} />
                    ) : (
                      <Text style={styles.tierIcon}>{meta.icon}</Text>
                    )}
                    <Text style={[styles.tierName, { color: colors.foreground }]}>{meta.label}</Text>
                    {isCurrent && (
                      <View style={[styles.currentBadge, { backgroundColor: meta.color + "20" }]}>
                        <Text style={[styles.currentBadgeText, { color: meta.color }]}>Current</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.tierPriceRow}>
                    <Text style={[styles.tierPrice, { color: colors.foreground }]}>
                      {billing === "annual" ? pricing.annual : pricing.monthly}
                    </Text>
                    <Text style={[styles.tierCredits, { color: meta.color }]}>{pricing.credits}</Text>
                  </View>
                </View>

                {/* Features */}
                <View style={styles.featureList}>
                  {pricing.features.map((f) => (
                    <View key={f} style={styles.featureRow}>
                      <Text style={[styles.featureCheck, { color: meta.color }]}>✓</Text>
                      <Text style={[styles.featureText, { color: colors.muted }]}>{f}</Text>
                    </View>
                  ))}
                </View>

                {/* CTA */}
                {!isCurrent && (
                  <TouchableOpacity
                    style={[styles.upgradeCta, { backgroundColor: meta.color }]}
                    onPress={() => handleUpgrade(tierId)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.upgradeCtaText}>
                        {currentTier === "free" ? "Get Started" : "Upgrade"}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
                {tierId === "independent" && !isCurrent && (
                  <TouchableOpacity
                    style={[styles.upgradeCta, { backgroundColor: meta.color }]}
                   onPress={() => Linking.openURL("mailto:industry@virelle.life?subject=Industry Plan Enquiry")}
                  >
                    <Text style={styles.upgradeCtaText}>Contact Sales</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}

          {/* ── Top-Up Packs ───────────────────────────────────────────────── */}
          <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 24 }]}>Credit Top-Up Packs</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
            One-time purchases — credits never expire
          </Text>
          <View style={styles.topupGrid}>
            {TOP_UP_PACKS.map((pack) => {
              const isLoading = loadingTopup === pack.id;
              return (
                <TouchableOpacity
                  key={pack.id}
                  style={[styles.topupCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => handleTopUp(pack.id)}
                  disabled={isLoading}
                >
                  {pack.savings ? (
                    <View style={styles.savingsTag}>
                      <Text style={styles.savingsText}>{pack.savings}</Text>
                    </View>
                  ) : null}
                  <Text style={[styles.topupName, { color: colors.foreground }]}>{pack.name}</Text>
                  <Text style={[styles.topupCredits, { color: "#8B5CF6" }]}>{pack.credits}</Text>
                  <Text style={[styles.topupCreditsLabel, { color: colors.muted }]}>credits</Text>
                  <Text style={[styles.topupPrice, { color: colors.foreground }]}>{pack.price}</Text>
                  {isLoading ? (
                    <ActivityIndicator color="#8B5CF6" size="small" style={{ marginTop: 8 }} />
                  ) : (
                    <Text style={[styles.topupBuyText, { color: "#8B5CF6" }]}>Buy Now →</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Footer note ────────────────────────────────────────────────── */}
          <Text style={[styles.footerNote, { color: colors.muted }]}>
            All prices in AUD. Subscriptions renew automatically. Manage or cancel anytime via the billing portal.
            Payments are processed securely by Stripe.
          </Text>

        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backBtn: { width: 60 },
  backText: { fontSize: 14 },
  title: { fontSize: 18, fontWeight: "700" },
  content: { padding: 20, gap: 16 },

  // Current plan card
  currentPlanCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 20,
    gap: 12,
  },
  planTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  planBadge: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  planIcon: { fontSize: 16 },
  planLabel: { fontSize: 13, fontWeight: "700", letterSpacing: 0.5 },
  manageBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  manageBtnText: { fontSize: 13, fontWeight: "600" },
  creditsRow: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  creditsValue: { fontSize: 36, fontWeight: "800", letterSpacing: -1 },
  creditsLabel: { fontSize: 14 },
  progressTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  lowCreditsWarning: { fontSize: 12, fontWeight: "600" },

  // Billing toggle
  billingToggle: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  billingOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  billingOptionText: { fontSize: 14, fontWeight: "600" },
  saveBadge: { backgroundColor: "#10B981", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  saveBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },

  // Section titles
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, marginBottom: 12, marginTop: -8 },

  // Tier cards
  tierCard: { borderRadius: 16, padding: 20, gap: 16 },
  tierHeader: { gap: 8 },
  tierTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  tierIcon: { fontSize: 20 },
  tierName: { fontSize: 18, fontWeight: "700", flex: 1 },
  currentBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  currentBadgeText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  tierPriceRow: { flexDirection: "row", alignItems: "baseline", gap: 12 },
  tierPrice: { fontSize: 22, fontWeight: "800" },
  tierCredits: { fontSize: 13, fontWeight: "600" },
  featureList: { gap: 8 },
  featureRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  featureCheck: { fontSize: 14, fontWeight: "700", width: 16 },
  featureText: { fontSize: 14, flex: 1 },
  upgradeCta: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  upgradeCtaText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  // Top-up grid
  topupGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  topupCard: {
    width: "47%",
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 4,
    position: "relative",
    overflow: "hidden",
  },
  savingsTag: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#10B981",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderBottomLeftRadius: 8,
  },
  savingsText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  topupName: { fontSize: 14, fontWeight: "700", marginTop: 8 },
  topupCredits: { fontSize: 24, fontWeight: "800" },
  topupCreditsLabel: { fontSize: 12, marginTop: -4 },
  topupPrice: { fontSize: 16, fontWeight: "700", marginTop: 4 },
  topupBuyText: { fontSize: 13, fontWeight: "600", marginTop: 4 },

  // Footer
  footerNote: { fontSize: 12, textAlign: "center", lineHeight: 18, marginTop: 8 },
});
