import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { trpc } from "@/lib/trpc";
import { useCredits } from "@/hooks/use-credits";

const TERMS_KEY = "@swappys_terms_v2";
const GOLD = "#d4af37";
const BG = "#0a0a0f";
const SURFACE = "#16161c";
const BORDER = "rgba(212,175,55,0.22)";
const CREATOR_TIERS = new Set(["amateur", "independent", "creator", "studio", "industry", "beta"]);

type ImageSlot = "source" | "target";

function TermsModal({ visible, onAgree, onDecline }: {
  visible: boolean;
  onAgree: () => void;
  onDecline: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Swappys consent and use rules</Text>
          <ScrollView style={styles.modalBody} contentContainerStyle={{ gap: 12 }}>
            <Text style={styles.modalText}>
              Use Swappys only with images you own or have explicit permission to transform. Every identifiable person must consent to likeness alteration and distribution.
            </Text>
            <Text style={styles.modalText}>
              Do not create non-consensual sexual content, content involving minors, harassment, fraud, deceptive impersonation, fake evidence or unlawful material.
            </Text>
            <Text style={styles.modalText}>
              Preview output may carry an AI-altered watermark. Professional clean exports and production continuity tools are available through Virelle Studios.
            </Text>
          </ScrollView>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={onDecline}>
              <Text style={styles.secondaryButtonText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={onAgree}>
              <Text style={styles.primaryButtonText}>I agree</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ImagePickerCard({ title, hint, image, onPress }: {
  title: string;
  hint: string;
  image: string | null;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.imageCard} activeOpacity={0.78} onPress={onPress}>
      {image ? (
        <>
          <Image source={{ uri: image }} style={styles.imagePreview} resizeMode="cover" />
          <View style={styles.changeBadge}><Text style={styles.changeText}>Change</Text></View>
        </>
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imageIcon}>＋</Text>
          <Text style={styles.imageTitle}>{title}</Text>
          <Text style={styles.imageHint}>{hint}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export function BodyFaceSwap() {
  const router = useRouter();
  const { tier, canAfford, refetch: refetchCredits } = useCredits();
  const isCreator = CREATOR_TIERS.has(tier);
  const creditCost = isCreator ? 5 : 2;

  const [termsVisible, setTermsVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [targetImage, setTargetImage] = useState<string | null>(null);
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(TERMS_KEY)
      .then((value) => {
        if (!active) return;
        if (value === "accepted") setReady(true);
        else setTermsVisible(true);
      })
      .catch(() => { if (active) setTermsVisible(true); });
    return () => { active = false; };
  }, []);

  const mutation = trpc.swap.bodyFaceSwap.useMutation({
    onSuccess: async (data) => {
      setResultUrl(data.imageUrl);
      await refetchCredits();
    },
    onError: (error) => Alert.alert("Swap failed", error.message),
  });

  const canSubmit = useMemo(
    () => Boolean(sourceImage && targetImage && consentConfirmed && !mutation.isPending),
    [sourceImage, targetImage, consentConfirmed, mutation.isPending],
  );

  const acceptTerms = useCallback(async () => {
    await AsyncStorage.setItem(TERMS_KEY, "accepted");
    setTermsVisible(false);
    setReady(true);
  }, []);

  const declineTerms = useCallback(() => {
    setTermsVisible(false);
    router.back();
  }, [router]);

  const pickImage = useCallback(async (slot: ImageSlot) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert("Photo access required", "Allow photo-library access to select source and target images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
      base64: true,
    });
    const asset = result.canceled ? null : result.assets[0];
    if (!asset?.base64) return;

    const mimeType = asset.mimeType && ["image/jpeg", "image/png", "image/webp"].includes(asset.mimeType)
      ? asset.mimeType
      : "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${asset.base64}`;
    if (slot === "source") setSourceImage(dataUrl);
    else setTargetImage(dataUrl);
    setResultUrl(null);
  }, []);

  const runSwap = useCallback(() => {
    if (!sourceImage || !targetImage) {
      Alert.alert("Two images required", "Select a clear source face and a target image.");
      return;
    }
    if (!consentConfirmed) {
      Alert.alert("Consent required", "Confirm that you have permission from every identifiable person.");
      return;
    }
    if (!canAfford(creditCost, "Face and body swap")) return;
    mutation.mutate({ sourceImageBase64: sourceImage, targetImageBase64: targetImage });
  }, [sourceImage, targetImage, consentConfirmed, canAfford, creditCost, mutation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <TermsModal visible={termsVisible} onAgree={acceptTerms} onDecline={declineTerms} />
      {ready ? (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View>
              <Text style={styles.brand}>Swappys</Text>
              <Text style={styles.subtitle}>AI likeness preview · Virelle Studios engine</Text>
            </View>
            <View style={styles.tierBadge}><Text style={styles.tierText}>{isCreator ? "CREATOR" : "PREVIEW"}</Text></View>
          </View>

          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>For best results</Text>
            <Text style={styles.noticeText}>Use one sharp, front-facing adult source face and a well-lit target image. Avoid sunglasses, heavy blur and multiple faces.</Text>
          </View>

          <View style={styles.imageRow}>
            <ImagePickerCard title="Source face" hint="Identity to place" image={sourceImage} onPress={() => pickImage("source")} />
            <ImagePickerCard title="Target image" hint="Body and scene to preserve" image={targetImage} onPress={() => pickImage("target")} />
          </View>

          <TouchableOpacity style={styles.consentRow} activeOpacity={0.8} onPress={() => setConsentConfirmed((value) => !value)}>
            <View style={[styles.checkbox, consentConfirmed && styles.checkboxChecked]}>
              {consentConfirmed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.consentText}>I own these images or have explicit consent from every identifiable person, and I will not use the result for fraud, harassment, exploitation or deception.</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.swapButton, !canSubmit && styles.disabledButton]}
            disabled={!canSubmit}
            onPress={runSwap}
          >
            {mutation.isPending ? <ActivityIndicator color="#0a0a0f" /> : <Text style={styles.swapButtonText}>Create preview · {creditCost} credits</Text>}
          </TouchableOpacity>

          {resultUrl && (
            <View style={styles.resultCard}>
              <View style={styles.resultImageWrap}>
                <Image source={{ uri: resultUrl }} style={styles.resultImage} resizeMode="cover" />
                {!isCreator && <View style={styles.watermark}><Text style={styles.watermarkText}>SWAPPYS PREVIEW · AI ALTERED</Text></View>}
              </View>
              <View style={styles.resultActions}>
                <Text style={styles.resultTitle}>Transformation complete</Text>
                <TouchableOpacity style={styles.primaryButton} onPress={() => router.push("/tool/subscription" as never)}>
                  <Text style={styles.primaryButtonText}>Open Virelle Creator upgrade</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => setResultUrl(null)}>
                  <Text style={styles.secondaryButtonText}>Create another</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.upgradeCard}>
            <Text style={styles.upgradeTitle}>Continue in Virelle Studios</Text>
            <Text style={styles.upgradeText}>Creator access adds clean studio exports, exact project handoff, identity continuity, VFX controls and broadcast/render workflows.</Text>
            <TouchableOpacity onPress={() => router.push("/tool/subscription" as never)}>
              <Text style={styles.upgradeLink}>Compare plans →</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.loading}><ActivityIndicator size="large" color={GOLD} /></View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1, backgroundColor: BG },
  content: { padding: 18, paddingBottom: 48, gap: 18 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brand: { color: "#fff", fontSize: 29, fontWeight: "900" },
  subtitle: { color: "#8f96a8", fontSize: 12, marginTop: 2 },
  tierBadge: { borderWidth: 1, borderColor: BORDER, backgroundColor: "rgba(212,175,55,0.08)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  tierText: { color: GOLD, fontSize: 10, fontWeight: "800", letterSpacing: 0.7 },
  notice: { borderWidth: 1, borderColor: BORDER, backgroundColor: "rgba(212,175,55,0.06)", borderRadius: 16, padding: 14 },
  noticeTitle: { color: GOLD, fontWeight: "800", fontSize: 13, marginBottom: 5 },
  noticeText: { color: "#b6bccb", fontSize: 12, lineHeight: 18 },
  imageRow: { flexDirection: "row", gap: 12 },
  imageCard: { flex: 1, aspectRatio: 1, borderRadius: 18, borderWidth: 1, borderColor: BORDER, backgroundColor: SURFACE, overflow: "hidden" },
  imagePreview: { width: "100%", height: "100%" },
  imagePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", padding: 12, gap: 5 },
  imageIcon: { color: GOLD, fontSize: 30, fontWeight: "300" },
  imageTitle: { color: "#f1f3f8", fontSize: 13, fontWeight: "800", textAlign: "center" },
  imageHint: { color: "#737b90", fontSize: 10, lineHeight: 14, textAlign: "center" },
  changeBadge: { position: "absolute", right: 7, bottom: 7, backgroundColor: "rgba(0,0,0,0.75)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  changeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  consentRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: 14, backgroundColor: SURFACE, padding: 13 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1, borderColor: "#697087", alignItems: "center", justifyContent: "center" },
  checkboxChecked: { backgroundColor: GOLD, borderColor: GOLD },
  checkmark: { color: "#0a0a0f", fontWeight: "900" },
  consentText: { flex: 1, color: "#aeb5c5", fontSize: 11, lineHeight: 17 },
  swapButton: { backgroundColor: GOLD, borderRadius: 16, minHeight: 54, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  disabledButton: { opacity: 0.38 },
  swapButtonText: { color: "#0a0a0f", fontSize: 15, fontWeight: "900" },
  resultCard: { borderRadius: 20, borderWidth: 1, borderColor: BORDER, backgroundColor: SURFACE, overflow: "hidden" },
  resultImageWrap: { position: "relative", aspectRatio: 1 },
  resultImage: { width: "100%", height: "100%" },
  watermark: { position: "absolute", left: 8, right: 8, bottom: 8, backgroundColor: "rgba(0,0,0,0.7)", borderRadius: 8, padding: 7 },
  watermarkText: { color: "#fff", fontSize: 9, fontWeight: "900", textAlign: "center", letterSpacing: 0.5 },
  resultActions: { padding: 14, gap: 10 },
  resultTitle: { color: "#fff", fontSize: 15, fontWeight: "800" },
  upgradeCard: { borderWidth: 1, borderColor: BORDER, backgroundColor: "rgba(212,175,55,0.06)", borderRadius: 18, padding: 15, gap: 7 },
  upgradeTitle: { color: GOLD, fontSize: 15, fontWeight: "900" },
  upgradeText: { color: "#aeb5c5", fontSize: 12, lineHeight: 18 },
  upgradeLink: { color: "#f0d47f", fontSize: 13, fontWeight: "800", marginTop: 3 },
  primaryButton: { flex: 1, backgroundColor: GOLD, borderRadius: 12, minHeight: 44, alignItems: "center", justifyContent: "center", paddingHorizontal: 14 },
  primaryButtonText: { color: "#0a0a0f", fontWeight: "900", fontSize: 13, textAlign: "center" },
  secondaryButton: { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", minHeight: 44, alignItems: "center", justifyContent: "center", paddingHorizontal: 14 },
  secondaryButtonText: { color: "#e5e7eb", fontWeight: "700", fontSize: 13, textAlign: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.78)", justifyContent: "flex-end" },
  modalCard: { maxHeight: "72%", backgroundColor: "#111119", borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: BORDER, padding: 20, gap: 15 },
  modalTitle: { color: "#fff", fontSize: 20, fontWeight: "900" },
  modalBody: { maxHeight: 330 },
  modalText: { color: "#b8bfce", fontSize: 13, lineHeight: 20 },
  modalActions: { flexDirection: "row", gap: 10 },
});
