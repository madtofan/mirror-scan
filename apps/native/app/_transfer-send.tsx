import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { useState, useEffect } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

function TransferSend() {
  const [amount, setAmount] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [sequence, setSequence] = useState(0);
  const [lastScannedData, setLastScannedData] = useState("");

  const qrData = JSON.stringify({
    amount: parseFloat(amount) || 0,
    sequence,
    type: "send",
  });

  useEffect(() => {
    if (sequence === 5) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      alert("Transaction Complete!");
    }
  }, [sequence]);

  if (showQR) {
    return (
      <View className="flex-1">
        <View className="h-1/2 items-center justify-center rounded-3xl p-6 bg-secondary mx-4 mt-4">
          <QRCode
            value={qrData}
            size={200}
            color="#000000"
            backgroundColor="#FFFFFF"
          />
          <Text className="mt-4 text-center text-foreground text-lg font-bold">
            {amount ? `$${amount}` : "$0"}
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
            <CameraView
              className="flex-1"
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ["qr"],
              }}
              onBarcodeScanned={(result) => {
                if (sequence >= 5) return;
                const data = result.data;
                if (data !== lastScannedData) {
                  setLastScannedData(data);
                  setSequence((prev) => prev + 1);
                  setScanned(false);
                }
              }}
            >
              <View className="flex-1 items-center justify-center">
                <View className="h-48 w-48 border-2 border-foreground/50 rounded-lg" />
                <Text className="mt-4 text-center text-foreground text-sm">
                  Point camera at recipient's QR code
                </Text>
              </View>
            </CameraView>
          )}
        </View>

        <TouchableOpacity
          className="absolute bottom-8 left-4 right-4 items-center rounded-full bg-default p-4"
          onPress={() => {
            setShowQR(false);
            setScanned(false);
            setSequence(0);
            setLastScannedData("");
          }}
        >
          <Text className="text-foreground font-semibold">Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center px-4 pt-4">
      <View className="w-full items-center rounded-2xl p-8 bg-secondary">
        <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-primary">
          <Ionicons name="send" size={40} color="#FFFFFF" />
        </View>
        <Text className="mb-2 font-bold text-3xl text-foreground">Send Money</Text>
        <Text className="text-center text-muted text-sm">
          Enter amount and scan recipient's QR code
        </Text>
      </View>

      <View className="mt-6 w-full rounded-xl p-4 bg-default">
        <Text className="mb-3 text-muted text-sm">Amount</Text>
        <View className="flex-row items-center gap-3">
          <View className="flex-1 rounded-lg border border-border bg-input p-3">
            <TextInput
              className="text-foreground text-lg"
              placeholder="0.00"
              placeholderTextColor="#6B7280"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
          </View>
          <View className="rounded-lg bg-accent px-4 py-3">
            <Text className="text-foreground font-bold text-lg">USD</Text>
          </View>
        </View>
      </View>

      {
        amount && (
          <View className="mt-auto w-full">
            <TouchableOpacity
              className={`w-full items-center rounded-full py-4 ${amount ? "bg-primary" : "bg-muted"
                }`}
              onPress={() => amount && setShowQR(true)}
              disabled={!amount}
            >
              <Text
                className={`font-bold text-lg ${amount ? "text-foreground" : "text-muted"
                  }`}
              >
                Continue
              </Text>
            </TouchableOpacity>
          </View>
        )
      }
    </View>
  );
}

export default TransferSend;