import React, { useState, useEffect, useCallback } from "react";
  import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Dimensions,
    SafeAreaView,
    Modal,
    Pressable,
  } from "react-native";
  import AsyncStorage from "@react-native-async-storage/async-storage";
  import * as ImagePicker from "expo-image-picker";
  import { trpc } from "@/lib/trpc";
  import { useAuth } from "@/hooks/use-auth";
  import { useRouter } from "expo-router";
  import { SwappysWatermark } from "@/components/swappys-watermark";

  const { width: W } = Dimensions.get("window");
  const CARD_SIZE = (W - 52) / 2;
  const DISCLAIMER_KEY = "@swappys_disclaimer_v1";

  const CREATOR_TIERS = new Set(["amateur", "independent", "creator", "studio", "industry", "beta"]);

  const GOLD = "#d4af37";
  const SURFACE = "#16161c";
  const BORDER = "rgba(212,175,55,0.18)";
  const BG = "#0a0a0f";

  // ── Legal Disclaimer Modal ────────────────────────────────────────────────────
  function DisclaimerModal({
    visible,
    onAgree,
    onDecline,
  }: {
    visible: boolean;
    onAgree: () => void;
    onDecline: () => void;
  }) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={dm.overlay}>
          <View style={dm.sheet}>
            {/* Icon + Title */}
            <View style={dm.titleRow}>
              <View style={dm.iconWrap}>
                <Text style={dm.iconText}>⚖️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={dm.title}>Consent & Liability Notice</Text>
                <Text style={dm.subtitle}>Please read before continuing</Text>
              </View>
            </View>

            {/* Divider */}
            <View style={dm.divider} />

            {/* Body */}
            <ScrollView style={dm.bodyScroll} showsVerticalScrollIndicator={false}>
              <Text style={dm.bodyText}>
                By proceeding, you represent and warrant that you have obtained{" "}
                <Text style={dm.bold}>explicit, prior consent</Text> from every
                identifiable living individual whose image, likeness, or identity
                will be processed or reproduced through this feature.
              </Text>

              <Text style={dm.bodyText}>
                Unauthorized use of a person's likeness may constitute a violation
                of right-of-publicity laws, privacy statutes, defamation standards,
                and other applicable regulations in your jurisdiction, and may expose
                you to civil and/or criminal liability.
              </Text>

              <View style={dm.highlightBox}>
                <Text style={dm.highlightText}>
                  Virelle Studios provides this technology solely as a creative
                  tool. Virelle Studios, its affiliates, directors, officers,
                  employees, and agents{" "}
                  <Text style={dm.bold}>expressly disclaim all liability</Text>{" "}
                  — including claims arising from defamation, invasion of privacy,
                  harassment, or any violation of a person's rights — resulting
                  from content you create, distribute, or use through this feature.
                </Text>
              </View>

              <Text style={dm.bodyText}>
                You assume{" "}
                <Text style={dm.bold}>sole and full legal responsibility</Text> for
                all content generated through your use of Swappys.
              </Text>
            </ScrollView>

            {/* Divider */}
            <View style={dm.divider} />

            {/* Actions */}
            <View style={dm.actions}>
              <TouchableOpacity style={dm.declineBtn} onPress={onDecline} activeOpacity={0.75}>
                <Text style={dm.declineBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={dm.agreeBtn} onPress={onAgree} activeOpacity={0.82}>
                <Text style={dm.agreeBtnText}>I Understand & Agree</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // ── Photo Picker Card ────────────────────────────────────────────────────────
  function PhotoCard({
    label,
    emoji,
    hint,
    image,
    onPress,
  }: {
    label: string;
    emoji: string;
    hint: string;
    image: string | null;
    onPress: () => void;
  }) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.75}
        style={[styles.photoCard, { width: CARD_SIZE, height: CARD_SIZE }]}
      >
        {image ? (
          <Image
            source={{ uri: image }}
            style={{ width: CARD_SIZE, height: CARD_SIZE, borderRadius: 18 }}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.photoEmpty}>
            <Text style={styles.photoEmoji}>{emoji}</Text>
            <Text style={styles.photoLabel}>{label}</Text>
            <Text style={styles.photoHint}>{hint}</Text>
          </View>
        )}
        {image && (
          <View style={styles.photoEditBadge}>
            <Text style={styles.photoEditText}>Change</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // ── Main Component ────────────────────────────────────────────────────────────
  export function BodyFaceSwap() {
    const { user } = useAuth();
    const router = useRouter();
    const isCreator = user ? CREATOR_TIERS.has((user as any).subscriptionTier ?? "") : false;

    const [disclaimerVisible, setDisclaimerVisible] = useState(false);
    const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

    const [sourceImage, setSourceImage] = useState<string | null>(null);
    const [targetImage, setTargetImage] = useState<string | null>(null);
    const [resultUrl, setResultUrl] = useState<string | null>(null);

    // Show disclaimer once on first open
    useEffect(() => {
      AsyncStorage.getItem(DISCLAIMER_KEY).then((val) => {
        if (val === "accepted") {
          setDisclaimerAccepted(true);
        } else {
          setDisclaimerVisible(true);
        }
      });
    }, []);

    const handleAgree = useCallback(async () => {
      await AsyncStorage.setItem(DISCLAIMER_KEY, "accepted");
      setDisclaimerAccepted(true);
      setDisclaimerVisible(false);
    }, []);

    const handleDecline = useCallback(() => {
      setDisclaimerVisible(false);
      router.back();
    }, [router]);

    const swapMutation = trpc.swap.bodyFaceSwap.useMutation({
      onSuccess: (data) => setResultUrl(data.imageUrl),
      onError: (err) => Alert.alert("Swap failed", err.message),
    });

    const pickImage = async (type: "source" | "target") => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Allow photo library access to pick images.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.75,
        base64: true,
      });
      if (!result.canceled && result.assets[0]?.base64) {
        const b64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
        if (type === "source") { setSourceImage(b64); setResultUrl(null); }
        else { setTargetImage(b64); setResultUrl(null); }
      }
    };

    const doSwap = () => {
      if (!sourceImage || !targetImage) {
        Alert.alert("Two photos needed", "Tap the cards above to add your photo and a target photo.");
        return;
      }
      swapMutation.mutate({ sourceImageBase64: sourceImage, targetImageBase64: targetImage });
    };

    const isReady = !!sourceImage && !!targetImage && !swapMutation.isPending;

    return (
      <SafeAreaView style={styles.safeArea}>
        {/* ── Disclaimer modal ──────────────────────────────────────────── */}
        <DisclaimerModal
          visible={disclaimerVisible}
          onAgree={handleAgree}
          onDecline={handleDecline}
        />

        {/* ── Blur the content until accepted ───────────────────────────── */}
        {disclaimerAccepted ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
          >
            {/* ── Header ────────────────────────────────────────────────── */}
            <View style={styles.header}>
              <View>
                <View style={styles.logoRow}>
                  <Text style={styles.logoStar}>✦</Text>
                  <Text style={styles.logoText}>Swappys</Text>
                </View>
                <Text style={styles.tagline}>AI Face & Body Swap</Text>
              </View>
              {!isCreator && (
                <TouchableOpacity
                  style={styles.creatorPill}
                  onPress={() => router.push("/tool/subscription" as never)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.creatorPillText}>⚡ Go Creator</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* ── Instruction ───────────────────────────────────────────── */}
            <Text style={styles.instruction}>
              Pick your photo + a target — we'll swap your face and body in
            </Text>

            {/* ── Photo Pickers ─────────────────────────────────────────── */}
            <View style={styles.pickerRow}>
              <View style={styles.pickerSlot}>
                <PhotoCard
                  label="Your Photo"
                  emoji="🤳"
                  hint="Your face & body"
                  image={sourceImage}
                  onPress={() => pickImage("source")}
                />
                <Text style={styles.pickerSlotLabel}>YOU</Text>
              </View>
              <View style={styles.arrowWrapper}>
                <Text style={styles.arrow}>→</Text>
              </View>
              <View style={styles.pickerSlot}>
                <PhotoCard
                  label="Target Photo"
                  emoji="🎭"
                  hint="Character or scene"
                  image={targetImage}
                  onPress={() => pickImage("target")}
                />
                <Text style={styles.pickerSlotLabel}>TARGET</Text>
              </View>
            </View>

            {/* ── Swap Button ───────────────────────────────────────────── */}
            <TouchableOpacity
              style={[styles.swapButton, !isReady && styles.swapButtonDisabled]}
              onPress={doSwap}
              disabled={!isReady}
              activeOpacity={0.82}
            >
              {swapMutation.isPending ? (
                <View style={styles.swapButtonInner}>
                  <ActivityIndicator color="#0a0a0f" size="small" />
                  <Text style={styles.swapButtonText}>Swapping…</Text>
                </View>
              ) : (
                <Text style={styles.swapButtonText}>✦  Swap Now</Text>
              )}
            </TouchableOpacity>

            {/* ── Free tier note ────────────────────────────────────────── */}
            {!isCreator && (
              <Text style={styles.freeNote}>Free · Watermarked output</Text>
            )}

            {/* ── Result ────────────────────────────────────────────────── */}
            {resultUrl && (
              <View style={styles.resultCard}>
                <View style={styles.resultImageWrap}>
                  <Image
                    source={{ uri: resultUrl }}
                    style={styles.resultImage}
                    resizeMode="cover"
                  />
                  {!isCreator && <SwappysWatermark visible />}
                </View>
                <View style={styles.resultFooter}>
                  <Text style={styles.resultLabel}>Your swap is ready</Text>
                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={() =>
                      Alert.alert(
                        isCreator ? "Saved" : "Upgrade to save without watermark",
                        isCreator
                          ? "Image saved to your camera roll."
                          : "Creator members can download clean, watermark-free swaps."
                      )
                    }
                  >
                    <Text style={styles.saveBtnText}>
                      {isCreator ? "💾  Save" : "💾  Save (watermarked)"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ── Upgrade Card ──────────────────────────────────────────── */}
            {!isCreator && (
              <TouchableOpacity
                style={styles.upgradeCard}
                onPress={() => router.push("/tool/subscription" as never)}
                activeOpacity={0.85}
              >
                <View style={styles.upgradeIconWrap}>
                  <Text style={styles.upgradeIcon}>⚡</Text>
                </View>
                <View style={styles.upgradeBody}>
                  <Text style={styles.upgradeTitle}>Upgrade to Creator</Text>
                  <Text style={styles.upgradeDesc}>
                    Remove watermark · Unlimited swaps · Full Virelle Studios filmmaking suite
                  </Text>
                </View>
                <Text style={styles.upgradeChevron}>›</Text>
              </TouchableOpacity>
            )}

            {/* ── Legal footnote ────────────────────────────────────────── */}
            <TouchableOpacity onPress={() => setDisclaimerVisible(true)}>
              <Text style={styles.legalFootnote}>
                ⚖️ Consent notice · Tap to review
              </Text>
            </TouchableOpacity>

            <View style={{ height: 24 }} />
          </ScrollView>
        ) : (
          // Show a minimal loading state while disclaimer decision is pending
          <View style={styles.pendingWrap}>
            <Text style={styles.logoStar}>✦</Text>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // ── Disclaimer modal styles ───────────────────────────────────────────────────
  const dm = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.85)",
      justifyContent: "flex-end",
      alignItems: "center",
    },
    sheet: {
      width: "100%",
      backgroundColor: "#13131a",
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      borderWidth: 1,
      borderColor: "rgba(212,175,55,0.2)",
      paddingTop: 24,
      paddingBottom: 36,
      maxHeight: "88%",
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingHorizontal: 24,
      marginBottom: 20,
    },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: "rgba(212,175,55,0.1)",
      borderWidth: 1,
      borderColor: "rgba(212,175,55,0.25)",
      alignItems: "center",
      justifyContent: "center",
    },
    iconText: { fontSize: 22 },
    title: { fontSize: 17, fontWeight: "800", color: "#fff" },
    subtitle: { fontSize: 12, color: "#666", marginTop: 2 },
    divider: { height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginBottom: 20 },
    bodyScroll: { maxHeight: 260, paddingHorizontal: 24 },
    bodyText: {
      fontSize: 13.5,
      color: "#aaa",
      lineHeight: 21,
      marginBottom: 14,
    },
    bold: { color: "#ddd", fontWeight: "700" },
    highlightBox: {
      backgroundColor: "rgba(212,175,55,0.07)",
      borderLeftWidth: 3,
      borderLeftColor: "#d4af37",
      borderRadius: 8,
      padding: 14,
      marginBottom: 14,
    },
    highlightText: { fontSize: 13, color: "#bbb", lineHeight: 20 },
    actions: {
      flexDirection: "row",
      gap: 12,
      paddingHorizontal: 24,
      paddingTop: 20,
    },
    declineBtn: {
      flex: 1,
      paddingVertical: 15,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.12)",
      backgroundColor: "rgba(255,255,255,0.04)",
      alignItems: "center",
    },
    declineBtnText: { color: "#888", fontSize: 15, fontWeight: "600" },
    agreeBtn: {
      flex: 2,
      paddingVertical: 15,
      borderRadius: 16,
      backgroundColor: "#d4af37",
      alignItems: "center",
      shadowColor: "#d4af37",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 6,
    },
    agreeBtnText: { color: "#0a0a0f", fontSize: 15, fontWeight: "800" },
  });

  // ── Screen styles ─────────────────────────────────────────────────────────────
  const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: BG },
    scroll: { flex: 1 },
    container: { padding: 20, gap: 22 },
    pendingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },

    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 4 },
    logoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    logoStar: { fontSize: 28, color: GOLD },
    logoText: { fontSize: 28, fontWeight: "800", color: "#ffffff", letterSpacing: -0.5 },
    tagline: { fontSize: 13, color: "#666", marginTop: 2, marginLeft: 36 },
    creatorPill: {
      backgroundColor: "rgba(212,175,55,0.12)",
      borderWidth: 1,
      borderColor: BORDER,
      borderRadius: 24,
      paddingHorizontal: 14,
      paddingVertical: 6,
    },
    creatorPillText: { color: GOLD, fontSize: 12, fontWeight: "700" },

    instruction: { color: "#777", fontSize: 14, lineHeight: 20, textAlign: "center", paddingHorizontal: 12 },

    pickerRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 0 },
    pickerSlot: { alignItems: "center", gap: 8 },
    pickerSlotLabel: { fontSize: 10, fontWeight: "700", color: "#555", letterSpacing: 1.5 },
    arrowWrapper: { paddingHorizontal: 10, paddingBottom: 20 },
    arrow: { fontSize: 24, color: GOLD, fontWeight: "300" },

    photoCard: {
      borderRadius: 18,
      overflow: "hidden",
      backgroundColor: SURFACE,
      borderWidth: 1.5,
      borderColor: BORDER,
      borderStyle: "dashed",
    },
    photoEmpty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6, padding: 12 },
    photoEmoji: { fontSize: 30 },
    photoLabel: { fontSize: 13, fontWeight: "700", color: "#ddd" },
    photoHint: { fontSize: 11, color: "#555", textAlign: "center" },
    photoEditBadge: {
      position: "absolute",
      bottom: 8,
      right: 8,
      backgroundColor: "rgba(0,0,0,0.65)",
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    photoEditText: { color: "#fff", fontSize: 10, fontWeight: "600" },

    swapButton: {
      backgroundColor: GOLD,
      borderRadius: 18,
      paddingVertical: 17,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: GOLD,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 14,
      elevation: 8,
    },
    swapButtonDisabled: { opacity: 0.38 },
    swapButtonInner: { flexDirection: "row", alignItems: "center", gap: 10 },
    swapButtonText: { color: "#0a0a0f", fontSize: 17, fontWeight: "800", letterSpacing: 0.3 },

    freeNote: { color: "#444", fontSize: 12, textAlign: "center", marginTop: -10 },

    resultCard: {
      backgroundColor: SURFACE,
      borderRadius: 20,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: BORDER,
    },
    resultImageWrap: { position: "relative" },
    resultImage: { width: "100%", aspectRatio: 1 },
    resultFooter: { padding: 14, gap: 10 },
    resultLabel: { fontSize: 14, fontWeight: "700", color: "#fff" },
    saveBtn: {
      backgroundColor: "rgba(255,255,255,0.06)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.1)",
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: "center",
    },
    saveBtnText: { color: "#ddd", fontWeight: "600", fontSize: 14 },

    upgradeCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: "rgba(212,175,55,0.07)",
      borderWidth: 1,
      borderColor: "rgba(212,175,55,0.25)",
      borderRadius: 18,
      padding: 16,
    },
    upgradeIconWrap: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: "rgba(212,175,55,0.15)",
      alignItems: "center",
      justifyContent: "center",
    },
    upgradeIcon: { fontSize: 20 },
    upgradeBody: { flex: 1 },
    upgradeTitle: { fontSize: 15, fontWeight: "800", color: GOLD },
    upgradeDesc: { fontSize: 12, color: "#888", marginTop: 3, lineHeight: 17 },
    upgradeChevron: { fontSize: 26, color: GOLD, fontWeight: "300" },

    legalFootnote: {
      fontSize: 11,
      color: "#444",
      textAlign: "center",
      textDecorationLine: "underline",
      marginTop: -8,
    },
  });
  