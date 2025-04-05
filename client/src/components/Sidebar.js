/**  @format */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import {
	Menu as MenuIcon,
	Dashboard as DashboardIcon,
	Home as HomeIcon,
	Backup as Backupicon,
	People as PeopleIcon,
	AddCircle as AddCircleIcon,
	ShoppingCart as ShoppingCartIcon,
	Storefront as StorefrontIcon,
	Assessment as AssessmentIcon,
	Inventory as InventoryIcon,
	LocalShipping as LocalShippingIcon,
	Receipt as ReceiptIcon,
	Money as MoneyIcon,
	Lock as LockIcon,
	Book as BookIcon,
	ExitToApp as ExitToAppIcon,
} from "@mui/icons-material";

const SidebarContainer = styled.div`
	width: ${({ collapsed }) => (collapsed ? "70px" : "250px")};
	height: 100vh;
	background: linear-gradient(to bottom, #002f6c, #0057b7);
	padding: 15px;
	color: white;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	position: fixed;
	top: 0;
	left: 0;
	box-shadow: 4px 0 10px rgba(0, 0, 0, 0.2);
	z-index: 1000;
	transition: width 0.3s ease-in-out;
	@media (max-width: 768px) {
		display: ${({ collapsed }) => (collapsed ? "none" : "block")};
	}
`;

const ToggleButton = styled.button`
	background: none;
	border: none;
	color: white;
	font-size: 24px;
	cursor: pointer;
	align-self: ${({ collapsed }) => (collapsed ? "center" : "flex-end")};
	margin-bottom: 20px;
	transition: 0.3s;
`;

const MobileMenuButton = styled.button`
	position: fixed;
	top: 10px;
	left: 10px;
	background: #0057b7;
	color: white;
	border: none;
	padding: 10px;
	border-radius: 50%;
	cursor: pointer;
	display: none;
	z-index: 1100;

	@media (max-width: 768px) {
		display: block;
	}
`;

const SidebarItem = styled.button`
	display: flex;
	align-items: center;
	gap: ${({ collapsed }) => (collapsed ? "0px" : "15px")};
	padding: 12px;
	color: white;
	background: ${({ active }) => (active ? "#004080" : "transparent")};
	border: none;
	text-align: left;
	width: 100%;
	cursor: pointer;
	margin-bottom: 5px;
	font-size: 16px;
	border-radius: 5px;
	transition: background 0.3s ease-in-out, gap 0.3s ease-in-out;

	&:hover {
		background: #0056b3;
	}

	&.active {
		background: #003366;
		font-weight: bold;
	}

	span {
		display: ${({ collapsed }) => (collapsed ? "none" : "inline")};
	}
`;

const LogoutButton = styled.button`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: ${({ collapsed }) => (collapsed ? "0px" : "12px")};
	background-color: #d32f2f;
	color: white;
	border: none;
	padding: 12px;
	margin-top: auto;
	font-size: 16px;
	font-weight: bold;
	border-radius: 5px;
	cursor: pointer;
	width: 100%;
	transition: background 0.3s ease-in-out, gap 0.3s ease-in-out;

	&:hover {
		background-color: #b71c1c;
	}

	span {
		display: ${({ collapsed }) => (collapsed ? "none" : "inline")};
	}
`;

const Sidebar = ({ role }) => {
	const navigate = useNavigate();
	const [collapsed, setCollapsed] = useState(false);

	const toggleSidebar = () => {
		setCollapsed(!collapsed);
	};

	return (
		<>
			{/* ✅ Mobile Toggle Button */}
			<MobileMenuButton onClick={() => setCollapsed(!collapsed)}>
				<MenuIcon />
			</MobileMenuButton>

			<SidebarContainer collapsed={collapsed}>
				<ToggleButton
					collapsed={collapsed}
					onClick={() => setCollapsed(!collapsed)}
				>
					<MenuIcon fontSize='large' />
				</ToggleButton>
				<h2>Menu Items</h2>

				{/* Admin Links */}
				{role === "Admin" && (
					<>
						<SidebarItem
							collapsed={collapsed}
							onClick={() => navigate("/admin-dashboard")}
						>
							<DashboardIcon fontSize='small' />
							<span>Dashboard</span>
						</SidebarItem>
						<SidebarItem
							collapsed={collapsed}
							onClick={() => navigate("/users")}
						>
							<PeopleIcon fontSize='small' />
							<span>Manage Users</span>
						</SidebarItem>
						<SidebarItem
							collapsed={collapsed}
							onClick={() => navigate("/register")}
						>
							<AddCircleIcon fontSize='small' />
							<span>Create Users</span>
						</SidebarItem>
						<SidebarItem
							collapsed={collapsed}
							onClick={() => navigate("/products")}
						>
							<StorefrontIcon fontSize='small' />
							<span>Manage Products</span>
						</SidebarItem>
						<SidebarItem
							collapsed={collapsed}
							onClick={() => navigate("/sales")}
						>
							<ShoppingCartIcon fontSize='small' />
							<span>View Sales</span>
						</SidebarItem>
						<SidebarItem
							collapsed={collapsed}
							onClick={() => navigate("/purchases")}
						>
							<ReceiptIcon fontSize='small' />
							<span>Make Purchases</span>
						</SidebarItem>
						<SidebarItem
							collapsed={collapsed}
							onClick={() => navigate("/stock")}
						>
							<InventoryIcon fontSize='small' />
							<span>Stock & Prices</span>
						</SidebarItem>
						<SidebarItem
							collapsed={collapsed}
							onClick={() => navigate("/suppliers")}
						>
							<LocalShippingIcon fontSize='small' />
							<span>Farmers/Suppliers</span>
						</SidebarItem>
						<SidebarItem
							collapsed={collapsed}
							onClick={() => navigate("/expenses")}
						>
							<BookIcon fontSize='small' />
							<span>Expenses</span>
						</SidebarItem>
						<SidebarItem
							collapsed={collapsed}
							onClick={() => navigate("/reports")}
						>
							<AssessmentIcon fontSize='small' />
							<span>Reports</span>
						</SidebarItem>
						<SidebarItem
							collapsed={collapsed}
							onClick={() => navigate("/change-password")}
						>
							<LockIcon fontSize='small' />
							<span>Change Password</span>
						</SidebarItem>
						<LogoutButton collapsed={collapsed} onClick={() => navigate("/")}>
							<ExitToAppIcon fontSize='small' />
							<span>Logout</span>
						</LogoutButton>
					</>
				)}

				{/* Manager Links */}
				{role === "Manager" && (
					<>
						<SidebarItem
							collapsed={collapsed}
							onClick={() => navigate("/manager-dashboard")}
						>
							<DashboardIcon fontSize='small' />
							<span>Dashboard</span>
						</SidebarItem>
						<SidebarItem
							collapsed={collapsed}
							onClick={() => navigate("/managerproducts")}
						>
							<StorefrontIcon fontSize='small' />
							<span>Manage Products</span>
						</SidebarItem>
						<SidebarItem
							collapsed={collapsed}
							onClick={() => navigate("/salesmanager")}
						>
							<ShoppingCartIcon fontSize='small' />
							<span>Make Sales</span>
						</SidebarItem>
						<SidebarItem
							collapsed={collapsed}
							onClick={() => navigate("/managersuppliers")}
						>
							<LocalShippingIcon fontSize='small' />
							<span>Farmers/Suppliers</span>
						</SidebarItem>
						<SidebarItem
							collapsed={collapsed}
							onClick={() => navigate("/stock")}
						>
							<InventoryIcon fontSize='small' />
							<span>Stock & Prices</span>
						</SidebarItem>
						<SidebarItem
							collapsed={collapsed}
							onClick={() => navigate("/managerpurchases")}
						>
							<ReceiptIcon fontSize='small' />
							<span>Make Purchases</span>
						</SidebarItem>
						<LogoutButton collapsed={collapsed} onClick={() => navigate("/")}>
							<ExitToAppIcon fontSize='small' />
							<span>Logout</span>
						</LogoutButton>
					</>
				)}

				{/* Cashier Links */}
				{role === "Cashier" && (
					<>
						<SidebarItem
							collapsed={collapsed}
							onClick={() => navigate("/cashier-dashboard")}
						>
							<DashboardIcon fontSize='small' />
							<span>Dashboard</span>
						</SidebarItem>
						<SidebarItem
							collapsed={collapsed}
							onClick={() => navigate("/cashiersales")}
						>
							<ShoppingCartIcon fontSize='small' />
							<span>Process Sales</span>
						</SidebarItem>
						<LogoutButton collapsed={collapsed} onClick={() => navigate("/")}>
							<ExitToAppIcon fontSize='small' />
							<span>Logout</span>
						</LogoutButton>
					</>
				)}

				{/* SuperAdmin Links */}
				{role === "SuperAdmin" && (
					<>
						<SidebarItem
							collapsed={collapsed}
							onClick={() => navigate("/superadmin-dashboard")}
						>
							<DashboardIcon fontSize='small' />
							<span>Dashboard</span>
						</SidebarItem>
						<SidebarItem
							collapsed={collapsed}
							onClick={() => navigate("/company-registration")}
						>
							<HomeIcon fontSize='small' />
							<span>Business Registration</span>
						</SidebarItem>
						<SidebarItem onClick={() => navigate("/manage-admins")}>
							<PeopleIcon fontSize='small' />
							<span>Manage Admins</span>
						</SidebarItem>
						<SidebarItem onClick={() => navigate("/backup")}>
							<Backupicon fontSize='small' />
							<span>Backup & Maintenance</span>
						</SidebarItem>

						<LogoutButton collapsed={collapsed} onClick={() => navigate("/")}>
							<ExitToAppIcon fontSize='small' />
							<span>Logout</span>
						</LogoutButton>
					</>
				)}
			</SidebarContainer>
		</>
	);
};

export default Sidebar;
