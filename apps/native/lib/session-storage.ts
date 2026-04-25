import AsyncStorage from "@react-native-async-storage/async-storage";

const SESSION_KEY = "cached_session";

export type SessionAndUser = {
	session: {
		createdAt: string | Date;
		expiresAt: string | Date;
		id: string;
		ipAddress: string;
		token: string;
		updatedAt: string | Date;
		userAgent: string;
		userId: string;
	};
	user: {
		createdAt: string | Date;
		email: string;
		emailVerified: boolean;
		id: string;
		image: string | null;
		name: string;
		updatedAt: string | Date;
	};
};

function serializeDate(value: string | Date): string {
	if (value instanceof Date) {
		return value.toISOString();
	}
	return value;
}

function serializeSession(session: SessionAndUser): SessionAndUser {
	return {
		session: {
			...session.session,
			createdAt: serializeDate(session.session.createdAt),
			expiresAt: serializeDate(session.session.expiresAt),
			updatedAt: serializeDate(session.session.updatedAt),
		},
		user: {
			...session.user,
			createdAt: serializeDate(session.user.createdAt),
			updatedAt: serializeDate(session.user.updatedAt),
		},
	};
}

export async function saveSession(session: SessionAndUser): Promise<void> {
	const serialized = serializeSession(session);
	await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(serialized));
}

export async function getStoredSession(): Promise<SessionAndUser | null> {
	const data = await AsyncStorage.getItem(SESSION_KEY);
	return data ? JSON.parse(data) : null;
}

export async function clearStoredSession(): Promise<void> {
	await AsyncStorage.removeItem(SESSION_KEY);
}