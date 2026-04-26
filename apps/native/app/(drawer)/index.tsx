import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { Surface, useThemeColor, useToast } from "heroui-native";
import { useCallback, useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Container } from "@/components/container";
import { getLatestEntry } from "@/lib/ledger";
import { handleTopUpResponse } from "@/lib/sync";
import { orpc } from "@/utils/orpc";

function WalletPage() {
	const foregroundColor = useThemeColor("foreground");
	const { toast } = useToast();

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

	const navigateToTransfer = useCallback(() => {
		router.push("/transfer");
	}, []);

	const handleTopUp = useCallback(async () => {
		try {
			const result = await orpc.topUp.call({ amount: 5000 });
			await handleTopUpResponse(result);
			setBalance(result.newBalance);
			toast.show({ variant: "success", label: "Top up successful!" });
		} catch (error) {
			toast.show({ variant: "danger", label: "Failed to top up" });
			console.error(error);
		}
	}, [toast]);

	return (
		<Container>
			<View className="flex-1 items-center justify-center px-6">
				<View className="w-full">
					<View className="mb-8">
						<Text className="mb-2 text-center font-medium text-lg text-muted">
							Your Balance
						</Text>
						<Text className="text-center font-bold text-5xl text-foreground">
							RM {(balance / 100).toFixed(2)}
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
				</View>

				<View className="absolute bottom-8 left-0 right-0 flex-row items-center justify-center gap-4">
					<TouchableOpacity
						onPress={handleTopUp}
						className="flex-row items-center gap-2 rounded-full bg-success px-6 py-4"
						style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }}
					>
						<Ionicons name="add" size={24} color={foregroundColor} />
						<Text className="font-semibold text-lg text-foreground">Top Up RM50</Text>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={navigateToTransfer}
						className="flex-row items-center gap-2 rounded-full bg-primary px-8 py-4"
						style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }}
					>
						<Ionicons name="swap-horizontal" size={24} color={foregroundColor} />
						<Text className="font-semibold text-lg text-foreground">Mirror Pay</Text>
					</TouchableOpacity>
				</View>
			</View>
		</Container>
	);
}

export default WalletPage;
