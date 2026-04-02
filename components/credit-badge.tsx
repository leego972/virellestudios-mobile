/**
 * CreditBadge — shows the user's current credit balance and optionally the cost of the current action.
 * Displayed in the header of every production tool.
 */
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { useCredits } from "@/hooks/use-credits";

interface CreditBadgeProps {
  /** Cost of the action this tool will perform. Shows a warning if balance is insufficient. */
  cost?: number;
}

export function CreditBadge({ cost }: CreditBadgeProps) {
  const colors = useColors();
  const router = useRouter();
  const { credits, isUnlimited, displayBalance, isLoading } = useCredits();

  if (isLoading) return null;

  const insufficient = !isUnlimited && cost !== undefined && credits < cost;

  return (
    <TouchableOpacity
      style={[
        styles.badge,
        { backgroundColor: insufficient ? colors.error + "22" : colors.surface, borderColor: insufficient ? colors.error : colors.border },
      ]}
      onPress={() => router.push("/tool/subscription" as never)}
      activeOpacity={0.7}
    >
      <Text style={[styles.icon]}>{insufficient ? "⚠️" : "💳"}</Text>
      <Text style={[styles.balance, { color: insufficient ? colors.error : colors.primary }]}>
        {displayBalance}
        {cost !== undefined && !isUnlimited && (
          <Text style={[styles.cost, { color: colors.muted }]}> / {cost}</Text>
        )}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  icon: { fontSize: 12 },
  balance: { fontSize: 13, fontWeight: "700" },
  cost: { fontSize: 12, fontWeight: "400" },
});
