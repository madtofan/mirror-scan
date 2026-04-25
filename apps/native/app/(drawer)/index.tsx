import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { Surface, useThemeColor } from "heroui-native";
import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import {
	Gesture,
	GestureDetector,
	GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";
import { Container } from "@/components/container";
import { getLatestEntry } from "@/lib/ledger";

const SPRING_CONFIG = {
	damping: 20,
	stiffness: 200,
};

const SWIPE_THRESHOLD = 80;

function WalletPage() {
	const translateY = useSharedValue(0);
	const opacity = useSharedValue(1);
	const scale = useSharedValue(1);

	const foregroundColor = useThemeColor("foreground");
	const mutedColor = useThemeColor("muted");

	const [balance, setBalance] = useState(0);
	const db = useSQLiteContext();

	useEffect(() => {
		const fetchBalance = async () => {
			const entry = await getLatestEntry(db);
			if (entry) {
				setBalance(entry.amount);
			}
		};
		fetchBalance();
	}, [db]);

	const navigateToSend = useCallback(() => {
		router.push("/send");
	}, []);

	const navigateToReceive = useCallback(() => {
		router.push("/receive");
	}, []);

	const panGesture = Gesture.Pan()
		.onStart(() => {
			"worklet";
			scale.value = withSpring(0.98, SPRING_CONFIG);
		})
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
						runOnJS(navigateToSend)();
					}
				});
				opacity.value = withSpring(0, SPRING_CONFIG);
			} else if (event.translationY > SWIPE_THRESHOLD) {
				translateY.value = withSpring(400, SPRING_CONFIG, (finished) => {
					if (finished) {
						runOnJS(navigateToReceive)();
					}
				});
				opacity.value = withSpring(0, SPRING_CONFIG);
			} else {
				translateY.value = withSpring(0, SPRING_CONFIG);
				opacity.value = withSpring(1, SPRING_CONFIG);
				scale.value = withSpring(1, SPRING_CONFIG);
			}
		});

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: translateY.value }, { scale: scale.value }],
		opacity: opacity.value,
	}));

	const arrowUpStyle = useAnimatedStyle(() => {
		const progress = Math.max(0, -translateY.value / SWIPE_THRESHOLD);
		return {
			opacity: 0.5 + progress * 0.5,
			transform: [{ scale: 1 + progress * 0.2 }],
		};
	});

	const arrowDownStyle = useAnimatedStyle(() => {
		const progress = Math.max(0, translateY.value / SWIPE_THRESHOLD);
		return {
			opacity: 0.5 + progress * 0.5,
			transform: [{ scale: 1 + progress * 0.2 }],
		};
	});

	return (
		<GestureHandlerRootView className="flex-1">
			<Container>
				<View className="flex-1 items-center justify-center px-6">
					<Animated.View style={animatedStyle} className="w-full">
						<View className="mb-8">
							<Text className="mb-2 text-center font-medium text-lg text-muted">
								Your Balance
							</Text>
							<Text className="text-center font-bold text-5xl text-foreground">
								${(balance / 100).toFixed(2)}
							</Text>
						</View>

						<Surface variant="secondary" className="w-full rounded-2xl p-6">
							<View className="flex-row items-center justify-between">
								<View className="flex-row items-center gap-3">
									<View className="h-12 w-12 items-center justify-center rounded-full bg-accent">
										<Ionicons name="wallet" size={24} color={foregroundColor} />
									</View>
									<View>
										<Text className="font-medium text-foreground text-lg">
											Wallet
										</Text>
										<Text className="text-muted text-sm">Active Account</Text>
									</View>
								</View>
								<Surface variant="default" className="bg-success/20 px-3 py-1">
									<Text className="font-semibold text-sm text-success">
										Verified
									</Text>
								</Surface>
							</View>
						</Surface>

						<View className="mt-8 flex-row justify-center gap-2">
							<View className="h-3 w-3 rounded-full bg-primary" />
							<View className="h-3 w-3 rounded-full bg-muted" />
							<View className="h-3 w-3 rounded-full bg-muted" />
						</View>
					</Animated.View>

					<Animated.View
						style={arrowDownStyle}
						className="absolute top-24 right-0 left-0 items-center"
					>
						<View className="flex-row items-center gap-2 rounded-full bg-muted/20 px-4 py-2">
							<Ionicons name="chevron-down" size={20} color={mutedColor} />
							<Text className="text-muted text-sm">Swipe down to Receive</Text>
						</View>
					</Animated.View>

					<Animated.View
						style={arrowUpStyle}
						className="absolute right-0 bottom-16 left-0 items-center"
					>
						<View className="flex-row items-center gap-2 rounded-full bg-muted/20 px-4 py-2">
							<Text className="text-muted text-sm">Swipe up to Send</Text>
							<Ionicons name="chevron-up" size={20} color={mutedColor} />
						</View>
					</Animated.View>

					<GestureDetector gesture={panGesture}>
						<View className="absolute inset-0" />
					</GestureDetector>
				</View>
			</Container>
		</GestureHandlerRootView>
	);
}

export default WalletPage;
