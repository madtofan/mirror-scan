import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

import { Container } from "@/components/container";
import { SignUp } from "@/components/sign-up";

export default function Signup() {
	const router = useRouter();

	const handleSigninClicked = () => {
		router.push("/signin");
	};

	return (
		<Container className="flex-1 justify-center p-6">
			<View className="gap-6">
				<SignUp />

				<View className="flex-row justify-center gap-1 align-bottom">
					<Text className="mb-2 text-muted text-sm">
						Already have an account?
					</Text>
					<TouchableOpacity className="ml-2" onPress={handleSigninClicked}>
						<Text className="font-medium text-primary text-sm">Sign in</Text>
					</TouchableOpacity>
				</View>
			</View>
		</Container>
	);
}
