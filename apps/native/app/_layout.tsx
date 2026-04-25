import "@/global.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { HeroUINativeProvider } from "heroui-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SplashScreenController } from "@/components/splash";
import { AppThemeProvider } from "@/contexts/app-theme-context";
import { useOfflineSession } from "@/lib/use-offline-session";
import { migrateDbIfNeeded } from "@/lib/ledger";
import { queryClient } from "@/utils/orpc";
import { useOnNetworkReady, getPendingPushFlag } from "@/lib/network";
import { retryPendingPush } from "@/lib/sync";

export const unstable_settings = {
	initialRouteName: "(drawer)",
};

function SyncRetryHandler() {
	const { session } = useOfflineSession();

	useOnNetworkReady(async () => {
		if (!session) return;
		const hasPending = await getPendingPushFlag();
		if (hasPending) {
			try {
				await retryPendingPush();
			} catch (error) {
				console.error("Failed to retry pending push:", error);
			}
		}
	});

	return null;
}

function StackLayout() {
	const { session } = useOfflineSession();
	console.log({ session });

	return (
		<Stack screenOptions={{}}>
			<Stack.Protected guard={!!session}>
				<Stack.Screen name="(drawer)" options={{ headerShown: false }} />
				<Stack.Screen
					name="modal"
					options={{ title: "Modal", presentation: "modal" }}
				/>
				<Stack.Screen
					name="transfer"
					options={{ headerShown: false, presentation: "modal" }}
				/>
			</Stack.Protected>
			<Stack.Protected guard={!session}>
				<Stack.Screen name="signup" options={{ headerShown: false }} />
				<Stack.Screen name="signin" options={{ headerShown: false }} />
			</Stack.Protected>
		</Stack>
	);
}

export default function Layout() {
	return (
		<SQLiteProvider databaseName="sqlite-local.db" onInit={migrateDbIfNeeded}>
			<QueryClientProvider client={queryClient}>
				<GestureHandlerRootView style={{ flex: 1 }}>
					<KeyboardProvider>
						<AppThemeProvider>
							<HeroUINativeProvider>
								<SplashScreenController />
								<SyncRetryHandler />
								<StackLayout />
							</HeroUINativeProvider>
						</AppThemeProvider>
					</KeyboardProvider>
				</GestureHandlerRootView>
			</QueryClientProvider>
		</SQLiteProvider>
	);
}
