import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Surface, useThemeColor } from "heroui-native";
import { useCallback } from "react";
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

const SPRING_CONFIG = {
	damping: 20,
	stiffness: 200,
};

const SWIPE_THRESHOLD = 80;

function SendPage() {
	const translateY = useSharedValue(0);
	const opacity = useSharedValue(1);

	const foregroundColor = useThemeColor("foreground");
	const mutedColor = useThemeColor("muted");

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
			if (event.translationY > SWIPE_THRESHOLD) {
				translateY.value = withSpring(400, SPRING_CONFIG, (finished) => {
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

	const arrowStyle = useAnimatedStyle(() => {
		const progress = Math.max(0, translateY.value / SWIPE_THRESHOLD);
		return {
			opacity: 0.5 + progress * 0.5,
		};
	});

	return (
		<GestureHandlerRootView className="flex-1">
			<Container>
				<View className="flex-1 items-center justify-center px-6">
					<Animated.View style={animatedStyle} className="w-full items-center">
						<Surface
							variant="secondary"
							className="w-full items-center rounded-2xl p-8"
						>
							<View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-primary">
								<Ionicons name="send" size={40} color={foregroundColor} />
							</View>
							<Text className="mb-2 font-bold text-3xl text-foreground">
								Send Money
							</Text>
							<Text className="text-center text-muted">
								Send money to anyone using their wallet address or phone number
							</Text>
						</Surface>

						<Surface variant="default" className="mt-6 w-full rounded-xl p-4">
							<Text className="mb-3 text-muted text-sm">
								Enter recipient details
							</Text>
							<View className="flex-row items-center gap-3">
								<View className="flex-1 rounded-lg border border-border bg-input p-3">
									<Text className="text-muted text-sm">
										Wallet address or phone
									</Text>
								</View>
								<View className="rounded-lg bg-accent px-4 py-3">
									<Ionicons name="qr-code" size={24} color={foregroundColor} />
								</View>
							</View>
						</Surface>

						<View className="mt-8 flex-row justify-center gap-2">
							<View className="h-3 w-3 rounded-full bg-muted" />
							<View className="h-3 w-3 rounded-full bg-primary" />
							<View className="h-3 w-3 rounded-full bg-muted" />
						</View>
					</Animated.View>

					<GestureDetector gesture={panGesture}>
						<Animated.View
							style={arrowStyle}
							className="absolute top-24 right-0 left-0 items-center"
						>
							<View className="flex-row items-center gap-2 rounded-full bg-muted/20 px-4 py-2">
								<Ionicons name="chevron-down" size={20} color={mutedColor} />
								<Text className="text-muted text-sm">
									Swipe down to go back
								</Text>
							</View>
						</Animated.View>
					</GestureDetector>
				</View>
			</Container>
		</GestureHandlerRootView>
	);
}

export default SendPage;
