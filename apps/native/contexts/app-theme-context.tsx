import type React from "react";
import { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { Uniwind, useUniwind } from "uniwind";

type AppThemeContextType = {
	currentTheme: string;
	isLight: boolean;
	isDark: boolean;
	setTheme: (theme: "light") => void;
	toggleTheme: () => void;
};

const AppThemeContext = createContext<AppThemeContextType | undefined>(
	undefined,
);

export const AppThemeProvider = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	const { theme, setTheme: _setTheme } = useUniwind();

	useEffect(() => {
		Uniwind.setTheme("light");
	}, []);

	const isLight = useMemo(() => {
		return true;
	}, []);

	const isDark = useMemo(() => {
		return false;
	}, []);

	const setTheme = useCallback((_newTheme: "light") => {
		Uniwind.setTheme("light");
	}, []);

	const toggleTheme = useCallback(() => {
		// No-op: always stay in light mode
	}, []);

	const value = useMemo(
		() => ({
			currentTheme: "light",
			isLight: true,
			isDark: false,
			setTheme,
			toggleTheme,
		}),
		[setTheme, toggleTheme],
	);

	return (
		<AppThemeContext.Provider value={value}>
			{children}
		</AppThemeContext.Provider>
	);
};

export function useAppTheme() {
	const context = useContext(AppThemeContext);
	if (!context) {
		throw new Error("useAppTheme must be used within AppThemeProvider");
	}
	return context;
}
