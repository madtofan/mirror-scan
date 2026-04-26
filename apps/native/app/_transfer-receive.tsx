import { router } from "expo-router";
import { sleep } from "@/utils/sleep";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { ReceiveFirst, ReceiveSecond, SendFirst } from "@/types/dto";
import { useOfflineSession } from "@/lib/use-offline-session";
import { useSQLiteContext } from "expo-sqlite";
import { addTransaction, generateTransactionData, TxStatus } from "@/lib/ledger";

function TransferReceive() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanEnabled, setScanEnabled] = useState(true);
  const [scanned, setScanned] = useState(false);
  const [sequence, setSequence] = useState(0);
  const [lastScannedData, setLastScannedData] = useState("");
  const [receivedAmount, setReceivedAmount] = useState("");
  const { session } = useOfflineSession();
  const [qrData, setQrData] = useState('')
  const db = useSQLiteContext();

  const generateFirstData = useCallback((): ReceiveFirst => {
    return {
      userId: session?.user.id ?? '',
    }
  }, [session]);

  const generateSecondData = useCallback((): ReceiveSecond => {
    return {
      message: 'success',
    }
  }, []);

  const reEnableScan = async () => {
    await sleep(300);
    setScanEnabled(true);
  }

  useEffect(() => {
    const handleReceivedTransaction = async (info: SendFirst) => {
      try {
        const txData = await generateTransactionData(
          db,
          info.sender,
          session?.user.id ?? '',
          info.amount_sent,
        );

        await addTransaction(db, {
          id: crypto.randomUUID(),
          from_pub_key: txData.fromPubKey,
          to_pub_key: txData.toPubKey,
          amount: txData.amount,
          prev_tx_hash: txData.prevTxHash,
          sequence_number: txData.sequenceNumber,
          signature: txData.signature,
          status: TxStatus.PENDING,
        });
      } catch (error) {
        console.error("Failed to add transaction:", error);
      }

      await sleep(1000);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(
        `/transaction-success?type=send&amount=${info.amount_sent}&timestamp=${Date.now()}&type=received`
      );
    }

    const info: SendFirst = JSON.parse(lastScannedData || "{}");
    if (info.amount_sent) {
      setQrData(JSON.stringify(
        generateSecondData()
      ));
      handleReceivedTransaction(info);
      setSequence(1);
      return;
    }

    if (sequence === 0) {
      setQrData(JSON.stringify(
        generateFirstData()
      ));
      return;
    }
  }, [lastScannedData, generateFirstData, generateSecondData, db, session]);

  return (
    <View className="flex-1">
      <View className="h-1/2 items-center justify-center rounded-3xl p-6 bg-secondary mx-4 mt-4">
        {qrData && (
          <QRCode value={qrData} size={200} color="#000000" backgroundColor="#FFFFFF" />
        )}
        <Text className="mt-4 text-center text-foreground text-lg font-bold">
          {session?.user.id ?? 'User not available'}
        </Text>
        {/* <Text className="text-center text-muted text-sm">Sequence: {sequence}/5</Text> */}
      </View>

      <View className="h-1/2 rounded-t-3xl overflow-hidden mx-4">
        {!permission?.granted ? (
          <View className="flex-1 items-center justify-center bg-default p-6">
            <Ionicons name="camera-outline" size={48} color="#9CA3AF" />
            <Text className="mt-4 text-center text-muted text-sm">
              Camera permission required
            </Text>
            <TouchableOpacity
              className="mt-4 rounded-lg bg-primary px-6 py-3"
              onPress={requestPermission}
            >
              <Text className="text-foreground font-semibold">Grant Permission</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <CameraView
              className="flex-1"
              facing="front"
              barcodeScannerSettings={{
                barcodeTypes: ["qr"],
              }}
              onBarcodeScanned={async (result) => {
                if (!scanEnabled) {
                  return;
                }
                const data = result.data;
                if (data !== lastScannedData) {
                  setLastScannedData(data);
                  setScanned(false);
                  setScanEnabled(false);
                  reEnableScan();
                }
              }}
            >
              <View className="flex-1 items-center justify-center">
                <View className="h-48 w-48 border-2 border-foreground/50 rounded-lg" />
                <Text className="mt-4 text-center text-foreground text-sm">
                  Point camera at sender's QR code
                </Text>
              </View>
            </CameraView>
          </>
        )}
      </View>
    </View>
  );
}

export default TransferReceive;
