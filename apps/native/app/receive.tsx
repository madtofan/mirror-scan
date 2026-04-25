import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Crypto from "expo-crypto";
import { router } from "expo-router";
import { Surface, useThemeColor } from "heroui-native";
import { useCallback, useRef, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import {
	Gesture,
	GestureDetector,
	GestureHandlerRootView,
} from "react-native-gesture-handler";
import QRCode from "react-native-qrcode-svg";
import Animated, {
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";

import { Container } from "@/components/container";

const SPRING_CONFIG = {
	damping: 20,
	stiffness: 200,
};

const SWIPE_THRESHOLD = 80;

function ReceivePage() {
	const [uuid] = useState(() => Crypto.randomUUID());
	const [permission, requestPermission] = useCameraPermissions();
	const [scannedValue, setScannedValue] = useState<string | null>(null);
	const cameraRef = useRef<CameraView>(null);
	const translateY = useSharedValue(0);
	const opacity = useSharedValue(1);

	const foregroundColor = useThemeColor("foreground");
	const mutedColor = useThemeColor("muted");

	const isPermissionGranted = permission?.granted;

	const goBack = useCallback(() => {
		router.back();
	}, []);

	const panGesture = Gesture.Pan()
		.onUpdate((event) => {
			"worklet";
			translateY.value = event.translationY;
			const progress = Math.abs(event.translationY) / SWIPE_THRESHOLD;
			opacity.value = 1 - progress * 0.3;
		})
		.onEnd((event) => {
			"worklet";
			if (event.translationY < -SWIPE_THRESHOLD) {
				translateY.value = withSpring(-400, SPRING_CONFIG, (finished) => {
					if (finished) {
						runOnJS(goBack)();
					}
				});
				opacity.value = withSpring(0, SPRING_CONFIG);
			} else {
				translateY.value = withSpring(0, SPRING_CONFIG);
				opacity.value = withSpring(1, SPRING_CONFIG);
			}
		});

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: translateY.value }],
		opacity: opacity.value,
	}));

	const handleBarCodeScanned = useCallback(
		(result: { type: string; data: string }) => {
			if (result.data && !scannedValue) {
				setScannedValue(result.data);
			}
		},
		[scannedValue],
	);

	const arrowStyle = useAnimatedStyle(() => {
		const progress = Math.max(0, -translateY.value / SWIPE_THRESHOLD);
		return {
			opacity: 0.5 + progress * 0.5,
		};
	});

	return (
		<GestureHandlerRootView className="flex-1">
			<Container>
				<View className="flex-1 px-6">
					<Animated.View style={animatedStyle} className="h-full">
						<View className="flex-1 items-center justify-center py-8">
							<Surface
								variant="default"
								className="items-center rounded-3xl p-6"
							>
								<QRCode
									value={uuid}
									size={250}
									color={foregroundColor}
									backgroundColor="transparent"
								/>
								<Text className="mt-4 text-center text-muted text-sm">
									Scan to send money
								</Text>
							</Surface>
						</View>

						<View className="h-1/2 pb-8">
							<Surface
								variant="secondary"
								className="flex-1 overflow-hidden rounded-2xl bg-red-50"
							>
								{isPermissionGranted ? (
									<View className="flex-1">
										<CameraView
											ref={cameraRef}
											facing="front"
											style={{ height: 300 }}
											barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
											onBarcodeScanned={handleBarCodeScanned}
										/>
										{scannedValue && (
											<View className="absolute right-4 bottom-4 left-4 rounded-lg bg-black/70 p-3">
												<Text className="text-center font-semibold text-white">
													{scannedValue}
												</Text>
											</View>
										)}
									</View>
								) : (
									<View className="flex-1 items-center justify-center">
										<TouchableOpacity onPress={requestPermission}>
											<Text className="text-center text-muted text-sm">
												Click to enable camera {"\n"}Tap to request permission
											</Text>
										</TouchableOpacity>
									</View>
								)}
							</Surface>
						</View>
					</Animated.View>

					<GestureDetector gesture={panGesture}>
						<Animated.View
							style={arrowStyle}
							className="absolute right-0 bottom-16 left-0 items-center"
						>
							<View className="flex-row items-center gap-2 rounded-full bg-muted/20 px-4 py-2">
								<Text className="text-muted text-sm">Swipe up to go back</Text>
								<Ionicons name="chevron-up" size={20} color={mutedColor} />
							</View>
						</Animated.View>
					</GestureDetector>
				</View>
			</Container>
		</GestureHandlerRootView>
	);
}

export default ReceivePage;
