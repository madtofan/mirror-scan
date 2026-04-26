import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Container } from "@/components/container";
import TransferSend from "./_transfer-send";
import TransferReceive from "./_transfer-receive";


function TransferPage() {
	const [activeTab, setActiveTab] = useState<"send" | "receive">("send");

	return (
		<View className="flex-1 bg-background">
			<Container>
				<View className="mb-4 flex-row items-center justify-between px-2">
					<TouchableOpacity
						className="p-2"
						onPress={() => router.back()}
					>
						<Ionicons name="close" size={28} color="#9CA3AF" />
					</TouchableOpacity>
					<Text className="font-bold text-xl text-foreground">Mirror Pay</Text>
					<View className="w-10" />
				</View>

				<View className="flex-1">
					{activeTab === "send" ? <TransferSend /> : <TransferReceive />}
				</View>

				<View className="mb-6 px-6">
					<View className="flex-row rounded-full bg-muted/20 p-1">
						<TouchableOpacity
							className={`flex-1 flex-row items-center justify-center rounded-full py-3 ${activeTab === "send" ? "bg-primary" : "bg-transparent"
								}`}
							onPress={() => setActiveTab("send")}
						>
							<Ionicons
								name="send"
								size={18}
								color={activeTab === "send" ? "#FFFFFF" : "#9CA3AF"}
							/>
							<Text
								className={`ml-2 font-semibold ${activeTab === "send" ? "text-foreground" : "text-muted"
									}`}
							>
								Send
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							className={`flex-1 flex-row items-center justify-center rounded-full py-3 ${activeTab === "receive" ? "bg-primary" : "bg-transparent"
								}`}
							onPress={() => setActiveTab("receive")}
						>
							<Ionicons
								name="receipt"
								size={18}
								color={activeTab === "receive" ? "#FFFFFF" : "#9CA3AF"}
							/>
							<Text
								className={`ml-2 font-semibold ${activeTab === "receive" ? "text-foreground" : "text-muted"
									}`}
							>
								Receive
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Container>
		</View>
	);
}

export default TransferPage;
