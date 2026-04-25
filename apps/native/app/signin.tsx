import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

import { Container } from "@/components/container";
import { SignIn } from "@/components/sign-in";

export default function Signin() {
	const router = useRouter();

	const handleSignupClicked = () => {
		router.push("/signup");
	};

	return (
		<Container className="flex-1 justify-center p-6">
			<View className="gap-6">
				<SignIn />

				<View className="flex-row justify-center gap-1">
					<Text className="text-muted text-sm">Don't have an account?</Text>
					<TouchableOpacity className="ml-2" onPress={handleSignupClicked}>
						<Text className="font-medium text-primary text-sm">Sign up</Text>
					</TouchableOpacity>
				</View>
			</View>
		</Container>
	);
}
