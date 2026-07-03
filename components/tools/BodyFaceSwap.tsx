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
  } from "react-native";
  import AsyncStorage from "@react-native-async-storage/async-storage";
  import * as ImagePicker from "expo-image-picker";
  import { trpc } from "@/lib/trpc";
  import { useAuth } from "@/hooks/use-auth";
import { useCredits } from "@/hooks/use-credits";
  import { useRouter } from "expo-router";
  import { SwappysWatermark } from "@/components/swappys-watermark";

  const { width: W } = Dimensions.get("window");
  const CARD_SIZE = (W - 52) / 2;
  const TERMS_KEY = "@swappys_terms_v1";
  const WELCOME_KEY = "@swappys_welcome_v1";

  const CREATOR_TIERS = new Set(["amateur", "independent", "creator", "studio", "industry", "beta"]);

  const GOLD = "#d4af37";
  const SURFACE = "#16161c";
  const BORDER = "rgba(212,175,55,0.18)";
  const BG = "#0a0a0f";

  // ─────────────────────────────────────────────────────────────────────────────
  // Terms & Conditions Modal
  // ─────────────────────────────────────────────────────────────────────────────
  function TermsModal({
    visible,
    onAgree,
    onDecline,
  }: {
    visible: boolean;
    onAgree: () => void;
    onDecline: () => void;
  }) {
    const Section = ({ n, title, children }: { n: string; title: string; children: React.ReactNode }) => (
      <View style={tm.section}>
        <Text style={tm.sectionTitle}>{n}. {title}</Text>
        {children}
      </View>
    );

    const P = ({ children }: { children: React.ReactNode }) => (
      <Text style={tm.para}>{children}</Text>
    );

    const B = ({ children }: { children: string }) => (
      <Text style={tm.bold}>{children}</Text>
    );

    const Bullet = ({ children }: { children: string }) => (
      <Text style={tm.bullet}>{"  •  "}{children}</Text>
    );

    return (
      <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
        <View style={tm.overlay}>
          <View style={tm.sheet}>

            {/* ── Header ──────────────────────────────────────────────── */}
            <View style={tm.header}>
              <View style={tm.iconWrap}>
                <Text style={tm.iconText}>⚖️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={tm.title}>Swappys Terms & Conditions</Text>
                <Text style={tm.meta}>Last updated: June 2026 · Powered by Virelle Studios</Text>
              </View>
            </View>

            {/* ── Responsibility banner ────────────────────────────────── */}
            <View style={tm.banner}>
              <Text style={tm.bannerLabel}>⚠️  User Responsibility Notice</Text>
              <Text style={tm.bannerText}>
                By creating an account and using Swappys, you accept{" "}
                <B>full and sole legal responsibility</B> for every piece of content you
                create or generate through this application. Swappys is a creative tool —
                not a publisher or content owner. All liability for the use of this tool
                rests entirely with you.
              </Text>
            </View>

            {/* ── Scrollable body ─────────────────────────────────────── */}
            <ScrollView
              style={tm.body}
              contentContainerStyle={tm.bodyContent}
              showsVerticalScrollIndicator
              indicatorStyle="white"
            >
              <Section n="1" title="Acceptance of Terms">
                <P>
                  By accessing, registering for, or using Swappys ("the App", "we", "us", or "our"),
                  you ("User", "you") agree to be bound by these Terms & Conditions ("Terms") in their
                  entirety. If you do not agree to all of these Terms, you must not access or use the App.
                </P>
                <P>
                  These Terms constitute a legally binding agreement between you and Virelle Studios,
                  the parent platform behind Swappys. By tapping{" "}
                  <B>"I Agree & Continue"</B>, you confirm you have read, understood, and accepted
                  these Terms, including our Privacy Policy and Acceptable Use Policy.
                </P>
              </Section>

              <Section n="2" title="Description of Service">
                <P>
                  Swappys is an AI-powered face and body swap application designed for{" "}
                  <B>creative entertainment and personal fun</B>. The App enables users to swap
                  faces and bodies in photographs using artificial intelligence via third-party
                  AI generation services.
                </P>
                <P>
                  <B>Swappys is a creative tool, not a content creator.</B> We do not direct,
                  approve, review, or endorse any content produced by users. All creative
                  decisions — including choice of photos, subjects, and how output is used —
                  are made solely by you.
                </P>
              </Section>

              <Section n="3" title="User Responsibility & Content Liability">
                <P>
                  You are <B>solely and entirely responsible</B> for all content you create, upload,
                  input, or generate using the App. This responsibility is absolute, non-transferable,
                  and cannot be diminished by any claim that the content was "AI-generated". You
                  directed the AI; you own the outcome.
                </P>
                <P>Your responsibility includes, without limitation:</P>
                <Bullet>All photos, images, and inputs you provide to the App</Bullet>
                <Bullet>All AI-generated content produced as a result of your inputs</Bullet>
                <Bullet>Any downstream use, sharing, or publication of generated content</Bullet>
                <Bullet>Ensuring all content complies with applicable laws in your jurisdiction</Bullet>
                <Bullet>Any harm — financial, reputational, or emotional — caused to any person by your content</Bullet>
                <Bullet>Any legal claims or proceedings arising from your use of the App</Bullet>
                <P>
                  Virelle Studios is not liable, under any circumstances, for any content generated
                  by users, including content that infringes third-party rights or violates any law.
                </P>
              </Section>

              <Section n="4" title="Consent to Use of Likeness">
                <View style={tm.highlightBox}>
                  <Text style={tm.highlightText}>
                    You <B>must obtain explicit, prior, written consent</B> from every identifiable
                    living individual whose image, likeness, or identity will be processed,
                    reproduced, or altered through this App before doing so.
                  </Text>
                </View>
                <P>
                  Unauthorized use of a person's likeness may constitute a violation of
                  right-of-publicity laws, privacy statutes, defamation standards, and other
                  applicable regulations in your jurisdiction. Such use may expose you to civil
                  and/or criminal liability.
                </P>
                <P>
                  <B>Virelle Studios expressly disclaims all liability</B> arising from
                  your failure to obtain proper consent, including claims of defamation, invasion
                  of privacy, harassment, identity misuse, or any violation of a person's rights.
                </P>
              </Section>

              <Section n="5" title="Acceptable Use Policy">
                <P>You agree not to use Swappys to create content that:</P>
                <Bullet>Depicts any person without their explicit consent</Bullet>
                <Bullet>Is sexually explicit, obscene, or pornographic</Bullet>
                <Bullet>Constitutes harassment, bullying, or targeted abuse of any individual</Bullet>
                <Bullet>Is defamatory, fraudulent, or maliciously misleading</Bullet>
                <Bullet>Impersonates public figures in harmful, deceptive, or misleading contexts</Bullet>
                <Bullet>Violates any applicable law, regulation, or third-party right</Bullet>
                <Bullet>Is intended to deceive others about the AI-generated nature of the content</Bullet>
                <P>
                  Violation of these terms will result in immediate account termination and may
                  be reported to the relevant authorities. Virelle Studios reserves the right
                  to remove any content and suspend any account at its sole discretion.
                </P>
              </Section>

              <Section n="6" title="Watermark & Output Notice">
                <View style={tm.highlightBox}>
                  <Text style={tm.highlightText}>
                    <B>Swappys is designed for fun and personal entertainment.</B>{" "}
                    All images generated by free users include a visible Swappys watermark
                    by default. This watermark may not be removed, obscured, or cropped from
                    any output produced under a free account.
                  </Text>
                </View>
                <P>
                  For <B>professional-quality, watermark-free output</B> and access to the
                  full Virelle Studios filmmaking suite — including unlimited swaps, HD export,
                  and AI production tools — upgrade to a{" "}
                  <B>Creator membership</B> at virelle.life.
                </P>
              </Section>

              <Section n="7" title="AI-Generated Content Disclaimer">
                <P>
                  Swappys accesses third-party AI generation services (including fal.ai and others).
                  The copyright status of AI-generated content is an evolving and unsettled area of
                  law that varies by jurisdiction. Virelle Studios makes no representation or warranty
                  regarding the copyright ownership, registrability, or enforceability of any
                  AI-generated output produced through this App.
                </P>
                <P>
                  You acknowledge that AI-generated output may be imperfect, unexpected, or produce
                  results that differ from your intent. Virelle Studios is not liable for the quality,
                  accuracy, or appropriateness of any AI-generated content.
                </P>
              </Section>

              <Section n="8" title="Limitation of Liability">
                <P>
                  To the fullest extent permitted by applicable law, Virelle Studios, its affiliates,
                  directors, officers, employees, licensors, and agents{" "}
                  <B>shall not be liable</B> for any indirect, incidental, special, consequential,
                  or punitive damages arising out of or in connection with your use of the App,
                  including but not limited to:
                </P>
                <Bullet>Any content you create, distribute, or publish using the App</Bullet>
                <Bullet>Any claims by third parties arising from your use of the App</Bullet>
                <Bullet>Any loss of data, revenue, reputation, or goodwill</Bullet>
                <Bullet>Any service interruption, errors, or unavailability of the App</Bullet>
                <P>
                  Our total aggregate liability to you for any claim arising under these Terms
                  shall not exceed the amount you paid to us in the twelve (12) months preceding
                  the claim, or £100 (GBP), whichever is greater.
                </P>
              </Section>

              <Section n="9" title="Governing Law">
                <P>
                  These Terms are governed by and construed in accordance with the laws of
                  Victoria, Australia, and the Commonwealth of Australia. As a company
                  established in Melbourne, Australia, any dispute arising under these
                  Terms shall be subject to the non-exclusive jurisdiction of the courts
                  of Victoria, Australia. These Terms are subject to the Australian
                  Consumer Law (Competition and Consumer Act 2010, Cth), and nothing
                  herein limits any rights you may have under that legislation or other
                  mandatory consumer protection laws in your country of residence.
                  Where both parties are located outside Australia, the laws of England
                  and Wales apply as a secondary governing law.
                </P>
              </Section>

              <Section n="10" title="Changes to These Terms">
                <P>
                  Virelle Studios reserves the right to update these Terms at any time. Continued
                  use of the App following notification of changes constitutes your acceptance of the
                  revised Terms. We will notify you of material changes via an in-app notice.
                </P>
                <P>
                  For questions regarding these Terms, contact us at{" "}
                  <B>legal@virelle.life</B>.
                </P>
              </Section>

              <View style={{ height: 8 }} />
            </ScrollView>

            {/* ── Action buttons ───────────────────────────────────────── */}
            <View style={tm.divider} />
            <View style={tm.actions}>
              <TouchableOpacity style={tm.declineBtn} onPress={onDecline} activeOpacity={0.75}>
                <Text style={tm.declineBtnText}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity style={tm.agreeBtn} onPress={onAgree} activeOpacity={0.82}>
                <Text style={tm.agreeBtnText}>I Agree & Continue</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Welcome Modal (shown once after first signup/login)
  // ─────────────────────────────────────────────────────────────────────────────
  function WelcomeModal({
    visible,
    onDismiss,
    onUpgrade,
  }: {
    visible: boolean;
    onDismiss: () => void;
    onUpgrade: () => void;
  }) {
    return (
      <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
        <View style={wm.overlay}>
          <View style={wm.card}>
            <Text style={wm.star}>✦</Text>
            <Text style={wm.title}>Welcome to Swappys</Text>
            <Text style={wm.subtitle}>AI Face & Body Swap</Text>

            <View style={wm.divider} />

            <View style={wm.item}>
              <Text style={wm.itemIcon}>🎭</Text>
              <View style={{ flex: 1 }}>
                <Text style={wm.itemTitle}>Made for fun & creativity</Text>
                <Text style={wm.itemDesc}>
                  Swappys is an entertainment app. Swap faces, experiment with
                  looks, and create fun content for personal use.
                </Text>
              </View>
            </View>

            <View style={wm.item}>
              <Text style={wm.itemIcon}>✦</Text>
              <View style={{ flex: 1 }}>
                <Text style={wm.itemTitle}>All free output is watermarked</Text>
                <Text style={wm.itemDesc}>
                  Every image generated on a free account includes a visible
                  Swappys watermark. This cannot be removed on the free tier.
                </Text>
              </View>
            </View>

            <View style={wm.item}>
              <Text style={wm.itemIcon}>⚡</Text>
              <View style={{ flex: 1 }}>
                <Text style={wm.itemTitle}>Need professional output?</Text>
                <Text style={wm.itemDesc}>
                  Upgrade to a Virelle Studios Creator membership for
                  watermark-free results, unlimited swaps, and the full
                  AI filmmaking suite.
                </Text>
              </View>
            </View>

            <View style={wm.divider} />

            <TouchableOpacity style={wm.primaryBtn} onPress={onDismiss} activeOpacity={0.82}>
              <Text style={wm.primaryBtnText}>✦  Start Swapping</Text>
            </TouchableOpacity>

            <TouchableOpacity style={wm.secondaryBtn} onPress={onUpgrade} activeOpacity={0.75}>
              <Text style={wm.secondaryBtnText}>Explore Creator Membership →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Photo Picker Card
  // ─────────────────────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────────────────────
  // Main BodyFaceSwap Screen
  // ─────────────────────────────────────────────────────────────────────────────
  export function BodyFaceSwap() {
    const { user } = useAuth();
  const { canAfford } = useCredits();
    const router = useRouter();
    const isCreator = user ? CREATOR_TIERS.has((user as any).subscriptionTier ?? "") : false;

    const [termsVisible, setTermsVisible] = useState(false);
    const [welcomeVisible, setWelcomeVisible] = useState(false);
    const [ready, setReady] = useState(false);

    const [sourceImage, setSourceImage] = useState<string | null>(null);
    const [targetImage, setTargetImage] = useState<string | null>(null);
    const [resultUrl, setResultUrl] = useState<string | null>(null);

    // On mount: decide what to show first
    useEffect(() => {
      (async () => {
        const termsAccepted = await AsyncStorage.getItem(TERMS_KEY);
        if (termsAccepted !== "accepted") {
          setTermsVisible(true);
        } else {
          const welcomed = await AsyncStorage.getItem(WELCOME_KEY);
          if (welcomed !== "seen") {
            setWelcomeVisible(true);
          } else {
            setReady(true);
          }
        }
      })();
    }, []);

    const handleTermsAgree = useCallback(async () => {
      await AsyncStorage.setItem(TERMS_KEY, "accepted");
      setTermsVisible(false);
      const welcomed = await AsyncStorage.getItem(WELCOME_KEY);
      if (welcomed !== "seen") {
        setWelcomeVisible(true);
      } else {
        setReady(true);
      }
    }, []);

    const handleTermsDecline = useCallback(() => {
      setTermsVisible(false);
      router.back();
    }, [router]);

    const handleWelcomeDismiss = useCallback(async () => {
      await AsyncStorage.setItem(WELCOME_KEY, "seen");
      setWelcomeVisible(false);
      setReady(true);
    }, []);

    const handleWelcomeUpgrade = useCallback(async () => {
      await AsyncStorage.setItem(WELCOME_KEY, "seen");
      setWelcomeVisible(false);
      router.push("/tool/subscription" as never);
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
        {/* ── Modals ────────────────────────────────────────────────────── */}
        <TermsModal
          visible={termsVisible}
          onAgree={handleTermsAgree}
          onDecline={handleTermsDecline}
        />
        <WelcomeModal
          visible={welcomeVisible}
          onDismiss={handleWelcomeDismiss}
          onUpgrade={handleWelcomeUpgrade}
        />

        {/* ── Main content (hidden until modals done) ────────────────────── */}
        {ready ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
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

            {/* Instruction */}
            <Text style={styles.instruction}>
              Pick your photo + a target — we'll swap your face and body in
            </Text>

            {/* Photo pickers */}
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

            {/* Swap button */}
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
                <Text style={styles.swapButtonText}>
                  {isCreator ? "✦  HD Swap Now" : "✦  Creative Swap"}
                </Text>
              )}
            </TouchableOpacity>

            {!isCreator && (
              <Text style={styles.freeNote}>
                Creative Mode · Free · Powered by Pollinations AI
              </Text>
            )}

            {/* Result */}
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
                  <Text style={styles.resultLabel}>
                    {swapMutation.data?.isCreatorSwap
                      ? "HD precision swap ready ✦"
                      : "Creative swap ready — upgrade for HD"}
                  </Text>
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

            {/* Upgrade card */}
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
                    HD precision face swap · No watermark · Unlimited swaps · Full Virelle Studios suite
                  </Text>
                </View>
                <Text style={styles.upgradeChevron}>›</Text>
              </TouchableOpacity>
            )}

            {/* Legal footnote */}
            <TouchableOpacity onPress={() => setTermsVisible(true)}>
              <Text style={styles.legalFootnote}>⚖️ Terms & Conditions · Tap to review</Text>
            </TouchableOpacity>

            <View style={{ height: 24 }} />
          </ScrollView>
        ) : (
          <View style={styles.pendingWrap}>
            <Text style={styles.logoStar}>✦</Text>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Terms modal styles
  // ─────────────────────────────────────────────────────────────────────────────
  const tm = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "flex-end" },
    sheet: {
      backgroundColor: "#13131a",
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      borderWidth: 1,
      borderColor: "rgba(212,175,55,0.2)",
      maxHeight: "92%",
      paddingTop: 24,
      paddingBottom: 12,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingHorizontal: 22,
      marginBottom: 16,
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
    title: { fontSize: 16, fontWeight: "800", color: "#fff" },
    meta: { fontSize: 11, color: "#555", marginTop: 2 },
    banner: {
      marginHorizontal: 22,
      marginBottom: 16,
      backgroundColor: "rgba(212,175,55,0.08)",
      borderLeftWidth: 3,
      borderLeftColor: GOLD,
      borderRadius: 10,
      padding: 14,
    },
    bannerLabel: { fontSize: 11, fontWeight: "700", color: GOLD, marginBottom: 6, letterSpacing: 0.5 },
    bannerText: { fontSize: 13, color: "#bbb", lineHeight: 20 },
    body: { flex: 1 },
    bodyContent: { paddingHorizontal: 22, paddingBottom: 8 },
    section: { marginBottom: 22 },
    sectionTitle: { fontSize: 14, fontWeight: "800", color: GOLD, marginBottom: 10 },
    para: { fontSize: 13, color: "#aaa", lineHeight: 20, marginBottom: 10 },
    bold: { color: "#ddd", fontWeight: "700" },
    bullet: { fontSize: 13, color: "#999", lineHeight: 22 },
    highlightBox: {
      backgroundColor: "rgba(212,175,55,0.07)",
      borderWidth: 1,
      borderColor: "rgba(212,175,55,0.2)",
      borderRadius: 10,
      padding: 14,
      marginBottom: 10,
    },
    highlightText: { fontSize: 13, color: "#bbb", lineHeight: 20 },
    divider: { height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginVertical: 16 },
    actions: {
      flexDirection: "row",
      gap: 12,
      paddingHorizontal: 22,
      paddingBottom: 20,
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
      backgroundColor: GOLD,
      alignItems: "center",
      shadowColor: GOLD,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 6,
    },
    agreeBtnText: { color: "#0a0a0f", fontSize: 15, fontWeight: "800" },
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Welcome modal styles
  // ─────────────────────────────────────────────────────────────────────────────
  const wm = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.88)",
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    card: {
      width: "100%",
      backgroundColor: "#13131a",
      borderRadius: 28,
      borderWidth: 1,
      borderColor: "rgba(212,175,55,0.25)",
      padding: 28,
      alignItems: "center",
    },
    star: { fontSize: 40, color: GOLD, marginBottom: 10 },
    title: { fontSize: 26, fontWeight: "800", color: "#fff", textAlign: "center" },
    subtitle: { fontSize: 14, color: "#666", marginTop: 4, marginBottom: 4 },
    divider: { width: "100%", height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginVertical: 22 },
    item: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 14,
      width: "100%",
      marginBottom: 18,
    },
    itemIcon: { fontSize: 22, marginTop: 1 },
    itemTitle: { fontSize: 14, fontWeight: "700", color: "#fff", marginBottom: 4 },
    itemDesc: { fontSize: 13, color: "#888", lineHeight: 19 },
    primaryBtn: {
      width: "100%",
      paddingVertical: 16,
      borderRadius: 18,
      backgroundColor: GOLD,
      alignItems: "center",
      marginBottom: 12,
      shadowColor: GOLD,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 7,
    },
    primaryBtnText: { color: "#0a0a0f", fontSize: 16, fontWeight: "800", letterSpacing: 0.3 },
    secondaryBtn: {
      paddingVertical: 10,
      alignItems: "center",
    },
    secondaryBtnText: { color: GOLD, fontSize: 13, fontWeight: "600" },
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Main screen styles
  // ─────────────────────────────────────────────────────────────────────────────
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
    pickerRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
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
 const creditCost = CREATOR_TIERS.has(user?.subscriptionTier ?? "") ? 5 : 2;
    if (!canAfford(creditCost, "Face/Body Swap")) return;
     