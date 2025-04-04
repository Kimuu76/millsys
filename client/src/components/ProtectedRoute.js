/** @format */

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ allowedRoles }) => {
	const { user } = useAuth();

	if (!user || !allowedRoles.includes(user.role)) {
		return <Navigate to='/' replace />;
	}

	return <Outlet />;
};

export default ProtectedRoute;

/** @format 

import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = ({ allowedRoles }) => {
	const token = localStorage.getItem("token");
	const role = localStorage.getItem("role");

	if (!token || !allowedRoles.includes(role)) {
		return <Navigate to='/' replace />;
	}

	return <Outlet />;
};

export default ProtectedRoute;*/
