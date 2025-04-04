/** @format */

import React, { createContext, useContext, useState, useEffect } from "react";

// Create Context
const AuthContext = createContext();

// Custom Hook to use AuthContext
export const useAuth = () => useContext(AuthContext);

// AuthProvider Component
export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	let logoutTimer = null; // ✅ Timer reference

	// ✅ Load user from localStorage on startup
	useEffect(() => {
		const token = localStorage.getItem("token");
		const role = localStorage.getItem("role");
		const companyId = localStorage.getItem("company_id");

		if (token && role && companyId) {
			setUser({ token, role, companyId });
			startIdleTimer(); // ✅ Start auto-logout timer
		}
	}, []);

	// ✅ Login Function
	const login = (token, role, companyId) => {
		localStorage.setItem("token", token);
		localStorage.setItem("role", role);
		localStorage.setItem("company_id", companyId);
		setUser({ token, role, companyId });
		startIdleTimer();
	};

	// ✅ Logout Function (NO useNavigate here)
	const logout = () => {
		localStorage.removeItem("token");
		localStorage.removeItem("role");
		localStorage.removeItem("company_id");
		setUser(null);
		window.dispatchEvent(new Event("logout"));
	};

	// ✅ Start or Reset Idle Timer
	const startIdleTimer = () => {
		if (logoutTimer) clearTimeout(logoutTimer);

		logoutTimer = setTimeout(() => {
			console.warn("⚠️ User inactive for 15 minutes. Logging out...");
			logout();
		}, 15 * 60 * 1000);
	};

	// ✅ Listen for user activity (reset timer on activity)
	useEffect(() => {
		const resetTimer = () => startIdleTimer();

		const events = ["mousemove", "keydown", "click", "scroll"];
		events.forEach((event) => window.addEventListener(event, resetTimer));

		return () => {
			events.forEach((event) => window.removeEventListener(event, resetTimer));
			if (logoutTimer) clearTimeout(logoutTimer);
		};
	}, []);

	return (
		<AuthContext.Provider value={{ user, login, logout }}>
			{children}
		</AuthContext.Provider>
	);
};
