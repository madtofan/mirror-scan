import { useEffect, useState, useCallback, useRef } from "react";
import { authClient } from "@/lib/auth-client";
import {
	saveSession,
	getStoredSession,
	clearStoredSession,
	type SessionAndUser,
} from "@/lib/session-storage";
import { pull } from "./sync";

type UseOfflineSessionResult = {
	session: SessionAndUser | null;
	isPending: boolean;
	isOffline: boolean;
	refresh: () => Promise<void>;
	lastPulled: Date | null;
};

export function useOfflineSession(): UseOfflineSessionResult {
	const [cachedSession, setCachedSession] = useState<SessionAndUser | null>(null);
	const [isOffline, setIsOffline] = useState(false);
	const [lastPulled, setLastPulled] = useState<Date | null>(null);
	const hasPulledRef = useRef(false);

	const { data: serverSession, isPending, error, refetch } = authClient.useSession();

	useEffect(() => {
		if (serverSession) {
			const sessionToSave: SessionAndUser = {
				session: {
					createdAt: serverSession.session.createdAt.toString(),
					expiresAt: serverSession.session.expiresAt.toString(),
					id: serverSession.session.id,
					ipAddress: serverSession.session.ipAddress ?? "",
					token: serverSession.session.token,
					updatedAt: serverSession.session.updatedAt.toString(),
					userAgent: serverSession.session.userAgent ?? "",
					userId: serverSession.session.userId,
				},
				user: {
					createdAt: serverSession.user.createdAt.toString(),
					email: serverSession.user.email,
					emailVerified: serverSession.user.emailVerified,
					id: serverSession.user.id,
					image: serverSession.user.image ?? null,
					name: serverSession.user.name,
					updatedAt: serverSession.user.updatedAt.toString(),
				},
			};
			saveSession(sessionToSave);
			setCachedSession(sessionToSave);
			setIsOffline(false);

			if (!hasPulledRef.current) {
				hasPulledRef.current = true;
				pull()
					.then(() => {
						setLastPulled(new Date());
					})
					.catch(console.error);
			}
		} else if (!isPending) {
			if (error) {
				getStoredSession().then((cached) => {
					setCachedSession(cached);
					setIsOffline(!!cached);
				});
			} else {
				clearStoredSession();
				setCachedSession(null);
				setIsOffline(false);
			}
		}
	}, [serverSession, isPending, error]);

	const refresh = useCallback(async () => {
		await refetch();
	}, [refetch]);

	return {
		session: cachedSession,
		isPending,
		isOffline,
		refresh,
		lastPulled,
	};
}