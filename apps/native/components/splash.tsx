import { SplashScreen } from "expo-router";
import { useOfflineSession } from "@/lib/use-offline-session";

SplashScreen.preventAutoHideAsync();

export function SplashScreenController() {
	const { isPending } = useOfflineSession();

	if (!isPending) {
		SplashScreen.hide();
	}

	return null;
}
