import { SplashScreen } from "expo-router";
import { authClient } from "@/lib/auth-client";

SplashScreen.preventAutoHideAsync();

export function SplashScreenController() {
	const { isPending } = authClient.useSession();

	if (!isPending) {
		SplashScreen.hide();
	}

	return null;
}
