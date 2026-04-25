import { sleep } from "@/utils/sleep";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { useState, useEffect } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

function TransferReceive() {
  const [uuid] = useState(() => {
    return "demo-uuid-" + Math.random().toString(36).substring(7);
  });
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [sequence, setSequence] = useState(0);
  const [lastScannedData, setLastScannedData] = useState("");

  const qrData = JSON.stringify({
    uuid,
    sequence,
    type: "receive",
  });

  useEffect(() => {
    if (sequence === 5) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      alert("Transaction Complete!");
    }
  }, [sequence]);

  return (
    <View className="flex-1">
      <View className="h-1/2 items-center justify-center rounded-3xl p-6 bg-secondary mx-4 mt-4">
        <QRCode value={qrData} size={200} color="#000000" backgroundColor="#FFFFFF" />
        <Text className="mt-4 text-center text-foreground text-lg font-bold">
          {uuid.slice(0, 8).toUpperCase()}
        </Text>
        <Text className="text-center text-muted text-sm">Sequence: {sequence}/5</Text>
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
                if (sequence >= 5) return;
                const data = result.data;
                if (data !== lastScannedData) {
                  await sleep(300);
                  setLastScannedData(data);
                  setSequence((prev) => prev + 1);
                  setScanned(false);
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
