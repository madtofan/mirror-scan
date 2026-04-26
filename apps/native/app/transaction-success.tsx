import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { Container } from "@/components/container";
import { useEffect, useState } from "react";
import { getPendingPushFlag } from "@/lib/network";

function TransactionSuccessPage() {
  const params = useLocalSearchParams<{
    type: string;
    amount: string;
    timestamp: string;
  }>();

  const { type, amount, timestamp } = params;

  const [isSyncing, setIsSyncing] = useState(true);

  const isSend = type === "send";
  const displayAmount = amount ? `RM ${amount}` : "RM 0.00";

  const formatTimestamp = (ts: string) => {
    const date = new Date(parseInt(ts, 10));
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  useEffect(() => {
    const checkSyncStatus = async () => {
      const hasPending = await getPendingPushFlag();
      setIsSyncing(hasPending);
    };

    checkSyncStatus();
    const interval = setInterval(checkSyncStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Container>
      <View className="flex-1 items-center justify-center px-6">
        <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-green-500">
          <Ionicons name="checkmark" size={48} color="#FFFFFF" />
        </View>

        <Text className="mb-8 font-bold text-2xl text-foreground text-center">
          Transaction successful!
        </Text>

        <View className="w-full items-center rounded-2xl p-6 bg-secondary">
          <Text className="text-muted text-sm">Amount</Text>
          <Text className="mt-1 font-bold text-4xl text-foreground">
            {displayAmount}
          </Text>
          <Text className="mt-2 text-lg text-foreground">
            {isSend ? "Sent" : "Received"}
          </Text>
        </View>

        {timestamp && (
          <Text className="mt-6 text-muted text-sm">
            {formatTimestamp(timestamp)}
          </Text>
        )}

        {isSyncing && (
          <View className="mt-4 flex-row items-center gap-2">
            <Ionicons name="cloud-upload-outline" size={16} color="#6B7280" />
            <Text className="text-muted text-sm">Syncing...</Text>
          </View>
        )}
      </View>

      <View className="mb-6 px-6">
        <TouchableOpacity
          className="w-full items-center rounded-full bg-primary py-4"
          onPress={() => router.replace("/")}
        >
          <Text className="font-bold text-lg text-foreground">Done</Text>
        </TouchableOpacity>
      </View>
    </Container>
  );
}

export default TransactionSuccessPage;
