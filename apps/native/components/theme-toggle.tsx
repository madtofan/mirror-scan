import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";
import { withUniwind } from "uniwind";

const StyledIonicons = withUniwind(Ionicons);

export function ThemeToggle() {
	return (
		<Pressable className="px-2.5">
			<StyledIonicons name="sunny" size={20} className="text-foreground" />
		</Pressable>
	);
}
