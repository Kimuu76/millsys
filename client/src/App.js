/** @format */
import React, { useEffect, useState } from "react";
import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
	useLocation,
	useNavigate,
} from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import styled from "styled-components";

import AdminDashboard from "./pages/AdminDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import CashierDashboard from "./pages/CashierDashboard";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import Users from "./pages/Users";
import Products from "./pages/Products";
import Sales from "./pages/Sales";
import Purchases from "./pages/Purchases";
import Expenses from "./pages/Expenses";
import Stock from "./pages/Stocks";
import Suppliers from "./pages/Suppliers";
import Header from "./components/Header";
import Footer from "./components/Footer";
import SalesCashier from "./pages/salesCashier";
import SalesManager from "./pages/salesManager";
import ReportsPage from "./pages/ReportsPage";
import Managerpurchases from "./pages/managerPurchases";
import Managersuppliers from "./pages/managerSuppliers";
import ManagerProducts from "./pages/managerProducts";
import CompanyRegistration from "./pages/CompanyRegister";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import AdminManagement from "./pages/AdminManagement";
import BackupMaintenance from "./pages/BackupMaintenance";
import AdminChangePassword from "./pages/AdminChangePassword";

// ✅ Styled Components for Layout
const AppContainer = styled.div`
	display: flex;
	height: 100vh;
	flex-direction: ${({ isMobile }) => (isMobile ? "column" : "row")};
`;

const MainContent = styled.div`
	flex-grow: 1;
	margin-left: ${({ showSidebar }) => (showSidebar ? "250px" : "0")};
	padding: 20px;
	width: ${({ showSidebar }) => (showSidebar ? "calc(100% - 250px)" : "100%")};
	overflow-x: hidden;
	@media (max-width: 768px) {
		margin-left: 0;
		width: 100%;
		padding: 15px;
	}
`;

const AppLayout = () => {
	const { user, logout } = useAuth();
	const location = useLocation();
	const navigate = useNavigate();
	const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

	useEffect(() => {
		const handleResize = () => setIsMobile(window.innerWidth < 768);
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	const hideSidebarRoutes = ["/"];
	const showSidebar = user && !hideSidebarRoutes.includes(location.pathname);

	//auto logout after 15 mins
	useEffect(() => {
		let logoutTimer;

		const resetTimer = () => {
			if (logoutTimer) clearTimeout(logoutTimer);
			logoutTimer = setTimeout(() => {
				console.warn("⚠️ User inactive for 15 minutes. Logging out...");
				logout();
				navigate("/");
			}, 15 * 60 * 1000);
		};

		// ✅ Detect User Activity
		const events = ["mousemove", "keydown", "click", "scroll"];
		events.forEach((event) => window.addEventListener(event, resetTimer));

		resetTimer(); // Start timer on component mount

		return () => {
			if (logoutTimer) clearTimeout(logoutTimer);
			events.forEach((event) => window.removeEventListener(event, resetTimer));
		};
	}, [logout, navigate]);

	return (
		<AppContainer isMobile={isMobile}>
			{/* ✅ Show Sidebar only if user is logged in & not on login page */}
			{showSidebar && <Sidebar role={user?.role} />}

			<MainContent showSidebar={showSidebar}>
				<Routes>
					{/* Public Routes */}
					<Route path='/' element={<Login />} />
					<Route
						path='/company-registration'
						element={<CompanyRegistration />}
					/>
					<Route path='/register' element={<Register />} />

					{/* Protected Routes */}
					<Route element={<ProtectedRoute allowedRoles={["SuperAdmin"]} />}>
						<Route
							path='/superadmin-dashboard'
							element={<SuperAdminDashboard />}
						/>
					</Route>
					<Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
						<Route path='/admin-dashboard' element={<AdminDashboard />} />
					</Route>
					<Route element={<ProtectedRoute allowedRoles={["Manager"]} />}>
						<Route path='/manager-dashboard' element={<ManagerDashboard />} />
					</Route>
					<Route element={<ProtectedRoute allowedRoles={["Cashier"]} />}>
						<Route path='/cashier-dashboard' element={<CashierDashboard />} />
					</Route>

					{/* Other Pages */}
					<Route path='/users' element={<Users />} />
					<Route path='/products' element={<Products />} />
					<Route path='/sales' element={<Sales />} />
					<Route path='/purchases' element={<Purchases />} />
					<Route path='/stock' element={<Stock />} />
					<Route path='/suppliers' element={<Suppliers />} />
					<Route path='/expenses' element={<Expenses />} />
					<Route path='/cashiersales' element={<SalesCashier />} />
					<Route path='/salesmanager' element={<SalesManager />} />
					<Route path='/managerpurchases' element={<Managerpurchases />} />
					<Route path='/managersuppliers' element={<Managersuppliers />} />
					<Route path='/managerproducts' element={<ManagerProducts />} />
					<Route path='/manage-admins' element={<AdminManagement />} />
					<Route path='/backup' element={<BackupMaintenance />} />
					<Route path='/reports' element={<ReportsPage />} />
					<Route path='/change-password' element={<AdminChangePassword />} />

					{/* Redirect to Login if Route Not Found */}
					<Route path='*' element={<Navigate to='/' />} />
				</Routes>
			</MainContent>

			<Footer />
		</AppContainer>
	);
};

// ✅ Wrap AppLayout inside Router
const App = () => (
	<Router>
		<AppLayout />
	</Router>
);

export default App;
