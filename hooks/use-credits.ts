/**
 * useCredits — shared hook for credit balance, cost checking, and insufficient-credits guard.
 * Used by every production tool to ensure consistent credit UX.
 */
import { useCallback } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { trpc } from "@/lib/trpc";

export function useCredits() {
  const router = useRouter();
  const { data, isLoading, refetch } = trpc.credits.balance.useQuery();

  const credits = data?.isUnlimited ? Infinity : (data?.credits ?? 0);
  const isUnlimited = data?.isUnlimited ?? false;
  const tier = data?.tier ?? "free";

  /**
   * Returns true if the user can afford `cost` credits.
   * If not, shows an Alert with an option to navigate to the subscription screen.
   */
  const canAfford = useCallback(
    (cost: number, toolName?: string): boolean => {
      if (isUnlimited) return true;
      if (credits >= cost) return true;
      Alert.alert(
        "Insufficient Credits",
        `${toolName ? `${toolName} requires` : "This action requires"} ${cost} credits. You have ${credits} credits remaining.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Get More Credits",
            onPress: () => router.push("/tool/subscription" as never),
          },
        ]
      );
      return false;
    },
    [credits, isUnlimited, router]
  );

  /** Formatted display string — "∞" for unlimited, number otherwise */
  const displayBalance = isUnlimited ? "∞" : String(credits);

  return { credits, isUnlimited, tier, isLoading, displayBalance, canAfford, refetch };
}
