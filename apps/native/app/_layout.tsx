import "@/global.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { HeroUINativeProvider } from "heroui-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SplashScreenController } from "@/components/splash";
import { AppThemeProvider } from "@/contexts/app-theme-context";
import { authClient } from "@/lib/auth-client";
import { migrateDbIfNeeded } from "@/lib/ledger";
import { queryClient } from "@/utils/orpc";

export const unstable_settings = {
	initialRouteName: "(drawer)",
};

function StackLayout() {
	const { data: session } = authClient.useSession();
	console.log({ session });

	return (
		<Stack screenOptions={{}}>
			<Stack.Protected guard={!!session}>
				<Stack.Screen name="(drawer)" options={{ headerShown: false }} />
				<Stack.Screen
					name="modal"
					options={{ title: "Modal", presentation: "modal" }}
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
								<StackLayout />
							</HeroUINativeProvider>
						</AppThemeProvider>
					</KeyboardProvider>
				</GestureHandlerRootView>
			</QueryClientProvider>
		</SQLiteProvider>
	);
}
