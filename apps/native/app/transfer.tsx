import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Container } from "@/components/container";

function TransferSend() {
	const [amount, setAmount] = useState("");
	const [showQR, setShowQR] = useState(false);
	const [permission, requestPermission] = useCameraPermissions();
	const [scanned, setScanned] = useState(false);

	if (showQR) {
		const qrData = JSON.stringify({ amount: parseFloat(amount) || 0, type: "send" });

		return (
			<View className="flex-1">
				<View className="h-1/2 items-center justify-center rounded-3xl p-6 bg-secondary mx-4 mt-4">
					<QRCode
						value={qrData}
						size={200}
						color="#FFFFFF"
						backgroundColor="transparent"
					/>
					<Text className="mt-4 text-center text-foreground text-lg font-bold">
						{amount ? `$${amount}` : "$0"}
					</Text>
					<Text className="text-center text-muted text-sm">
						Show this QR code to send {amount ? `$${amount}` : "money"}
					</Text>
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
								<Text className="text-white font-semibold">Grant Permission</Text>
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
								if (scanned) return;
								const data = result.data;
								setScanned(true);
								alert(`Scanned: ${data}`);
							}}
						>
							<View className="flex-1 items-center justify-center">
								<View className="h-48 w-48 border-2 border-white/50 rounded-lg" />
								<Text className="mt-4 text-center text-white text-sm">
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
						<Text className="text-white font-bold text-lg">USD</Text>
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
								className={`font-bold text-lg ${amount ? "text-white" : "text-muted"
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

function TransferReceive() {
	const [uuid] = useState(() => {
		return "demo-uuid-" + Math.random().toString(36).substring(7);
	});
	const [permission, requestPermission] = useCameraPermissions();
	const [scanned, setScanned] = useState(false);

	return (
		<View className="flex-1">
			<View className="h-1/2 items-center justify-center rounded-3xl p-6 bg-secondary mx-4 mt-4">
				<QRCode value={uuid} size={200} color="#FFFFFF" backgroundColor="transparent" />
				<Text className="mt-4 text-center text-foreground text-lg font-bold">
					${uuid.slice(0, 8).toUpperCase()}
				</Text>
				<Text className="text-center text-muted text-sm">
					Share this code to receive money
				</Text>
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
							<Text className="text-white font-semibold">Grant Permission</Text>
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
							if (scanned) return;
							setScanned(true);
							alert(`Scanned: ${result.data}`);
						}}
					>
						<View className="flex-1 items-center justify-center">
							<View className="h-48 w-48 border-2 border-white/50 rounded-lg" />
							<Text className="mt-4 text-center text-white text-sm">
								Point camera at sender's QR code
							</Text>
						</View>
					</CameraView>
				)}
			</View>
		</View>
	);
}

function TransferPage() {
	const [activeTab, setActiveTab] = useState<"send" | "receive">("send");

	return (
		<View className="flex-1 bg-background">
			<Container>
				<View className="mb-4 flex-row items-center justify-between px-2">
					<TouchableOpacity
						className="p-2"
						onPress={() => router.back()}
					>
						<Ionicons name="close" size={28} color="#9CA3AF" />
					</TouchableOpacity>
					<Text className="font-bold text-xl text-foreground">Transfer</Text>
					<View className="w-10" />
				</View>

				<View className="flex-1">
					{activeTab === "send" ? <TransferSend /> : <TransferReceive />}
				</View>

				<View className="mb-6 px-6">
					<View className="flex-row rounded-full bg-muted/20 p-1">
						<TouchableOpacity
							className={`flex-1 flex-row items-center justify-center rounded-full py-3 ${activeTab === "send" ? "bg-primary" : "bg-transparent"
								}`}
							onPress={() => setActiveTab("send")}
						>
							<Ionicons
								name="send"
								size={18}
								color={activeTab === "send" ? "#FFFFFF" : "#9CA3AF"}
							/>
							<Text
								className={`ml-2 font-semibold ${activeTab === "send" ? "text-white" : "text-muted"
									}`}
							>
								Send
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							className={`flex-1 flex-row items-center justify-center rounded-full py-3 ${activeTab === "receive" ? "bg-primary" : "bg-transparent"
								}`}
							onPress={() => setActiveTab("receive")}
						>
							<Ionicons
								name="receive"
								size={18}
								color={activeTab === "receive" ? "#FFFFFF" : "#9CA3AF"}
							/>
							<Text
								className={`ml-2 font-semibold ${activeTab === "receive" ? "text-white" : "text-muted"
									}`}
							>
								Receive
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Container>
		</View>
	);
}

export default TransferPage;
