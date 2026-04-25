import * as Network from "expo-network";
import { useEffect, useRef, useState } from "react";

export type NetworkStatus = {
	isConnected: boolean;
	connectionType: Network.NetworkStateType | null;
};

const PENDING_PUSH_KEY = "hasPendingPush";

export async function getPendingPushFlag(): Promise<boolean> {
	const AsyncStorage = await import("@react-native-async-storage/async-storage");
	const value = await AsyncStorage.default.getItem(PENDING_PUSH_KEY);
	return value === "true";
}

export async function setPendingPushFlag(hasPending: boolean): Promise<void> {
	const AsyncStorage = await import("@react-native-async-storage/async-storage");
	if (hasPending) {
		await AsyncStorage.default.setItem(PENDING_PUSH_KEY, "true");
	} else {
		await AsyncStorage.default.removeItem(PENDING_PUSH_KEY);
	}
}

export function useNetworkStatus(): NetworkStatus {
	const [status, setStatus] = useState<NetworkStatus>({
		isConnected: false,
		connectionType: null,
	});

	const checkNetwork = async () => {
		try {
			const state = await Network.getNetworkStateAsync();
			setStatus({
				isConnected: state.isConnected ?? false,
				connectionType: state.type ?? null,
			});
		} catch {
			setStatus({
				isConnected: false,
				connectionType: null,
			});
		}
	};

	useEffect(() => {
		checkNetwork();

		const unsubscribe = Network.addNetworkStateListener((state) => {
			setStatus({
				isConnected: state.isConnected ?? false,
				connectionType: state.type ?? null,
			});
		});

		return () => {
			unsubscribe.remove();
		};
	}, []);

	return status;
}

export function useOnNetworkReady(callback: () => void | Promise<void>): void {
	const status = useNetworkStatus();
	const hasCalledRef = useRef(false);
	const callbackRef = useRef(callback);
	callbackRef.current = callback;

	useEffect(() => {
		callbackRef.current = callback;
	}, [callback]);

	useEffect(() => {
		if (status.isConnected === true && !hasCalledRef.current) {
			hasCalledRef.current = true;
			const fn = callbackRef.current;
			if (fn) {
			 Promise.resolve(fn()).catch(console.error);
			}
		} else if (status.isConnected === false) {
			hasCalledRef.current = false;
		}
	}, [status.isConnected]);
}