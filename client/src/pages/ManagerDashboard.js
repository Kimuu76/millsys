/** @format */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from "recharts";
import {
	Card,
	CardContent,
	Typography,
	CircularProgress,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Snackbar,
} from "@mui/material";
import API_BASE_URL from "../config";

const DashboardContainer = styled.div`
	padding: 20px;
`;

const CardsContainer = styled.div`
	display: flex;
	gap: 20px;
	margin-bottom: 20px;
	flex-wrap: wrap;
`;

const StyledCard = styled(Card)`
	flex: 1;
	background: #f8f9fa;
	box-shadow: 2px 4px 10px rgba(0, 0, 0, 0.1);
	text-align: center;
	min-width: 200px;
`;

const ChartContainer = styled.div`
	background: white;
	padding: 20px;
	box-shadow: 2px 4px 10px rgba(0, 0, 0, 0.1);
	border-radius: 8px;
	margin-top: 20px;
`;
const ProfitText = styled(Typography)`
	font-size: 1.5rem;
	font-weight: bold;
	color: ${(props) => (props.$isProfit ? "green" : "red")}; /* Use $ prefix */
`;

const ManagerDashboard = () => {
	const [items, setItems] = useState([]);
	const [stats, setStats] = useState(null);
	const [chartData, setChartData] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [selectedItem, setSelectedItem] = useState(null);
	const [openDialog, setOpenDialog] = useState(false);
	const [openSnackbar, setOpenSnackbar] = useState(false);
	const [snackbarMessage, setSnackbarMessage] = useState("");
	const navigate = useNavigate();

	useEffect(() => {
		const fetchDashboardData = async () => {
			try {
				const token = localStorage.getItem("token"); // ✅ Get token
				if (!token) {
					setError("Unauthorized. Please log in.");
					setLoading(false);
					return;
				}

				const response = await fetch(`${API_BASE_URL}/api/dashboard`, {
					headers: {
						Authorization: `Bearer ${token}`, // ✅ Send token for authentication
					},
				});

				if (!response.ok) throw new Error("Failed to fetch dashboard data");

				const data = await response.json();
				setStats(data);
				setChartData(data.salesData || []);
				setLoading(false);
			} catch (error) {
				console.error("Error fetching manager dashboard data:", error);
				setError("Failed to load dashboard data");
				setLoading(false);
			}
		};
		fetchDashboardData();
	}, []);

	if (loading) {
		return (
			<DashboardContainer>
				<Typography variant='h5'>Loading Dashboard...</Typography>
				<CircularProgress />
			</DashboardContainer>
		);
	}

	if (error) {
		return (
			<DashboardContainer>
				<Typography variant='h5' color='error'>
					Error: {error}
				</Typography>
			</DashboardContainer>
		);
	}

	// Calculate Profit or Loss
	const totalSales = stats?.total_sales || 0;
	const totalPurchases = stats?.total_purchases || 0;
	const totalExpenses = stats?.total_expenses || 0;
	const totalStock = stats?.total_stock || 0;
	const profit = totalSales - (totalPurchases + totalExpenses);
	const isProfit = profit >= 0;

	return (
		<DashboardContainer>
			<h2>Manager Dashboard</h2>

			{/* Overview Cards */}
			<CardsContainer>
				<StyledCard>
					<CardContent>
						<Typography variant='h5'>
							KES {stats?.total_sales?.toLocaleString()}
						</Typography>
						<Typography variant='body2'>Total Sales</Typography>
					</CardContent>
				</StyledCard>
				<StyledCard>
					<CardContent>
						<Typography variant='h5'>
							KES {stats?.total_purchases?.toLocaleString()}
						</Typography>
						<Typography variant='body2'>Total Purchases</Typography>
					</CardContent>
				</StyledCard>
				<StyledCard>
					<CardContent>
						<Typography variant='h5'>
							KES {totalExpenses.toLocaleString()}
						</Typography>
						<Typography variant='body2'>Total Expenses</Typography>
					</CardContent>
				</StyledCard>
				<StyledCard>
					<CardContent>
						<Typography variant='h5'>
							{totalStock.toLocaleString()} Litres
						</Typography>
						<Typography variant='body2'>Total Stock</Typography>
					</CardContent>
				</StyledCard>
				{/* Profit/Loss Card */}
				<StyledCard>
					<CardContent>
						<ProfitText $isProfit={isProfit}>
							KES {profit.toLocaleString()}
						</ProfitText>
						<Typography variant='body2'>
							{isProfit ? "Net Profit" : "Net Loss"}
						</Typography>
					</CardContent>
				</StyledCard>
				<StyledCard>
					<CardContent>
						<Typography variant='h5'>{stats?.total_staff}</Typography>
						<Typography variant='body2'>Total Staff</Typography>
					</CardContent>
				</StyledCard>
			</CardsContainer>

			{/* Sales & purchases Performance Chart */}
			<ChartContainer>
				<h3>Sales & Purchases Performance</h3>
				<ResponsiveContainer width='100%' height={300}>
					<BarChart data={chartData}>
						<XAxis dataKey='month' />
						<YAxis />
						<Tooltip />
						<Legend />
						<Bar dataKey='sales' fill='#007bff' name='Sales' />
						<Bar dataKey='purchases' fill='#ff5733' name='Purchases' />
					</BarChart>
				</ResponsiveContainer>
			</ChartContainer>
		</DashboardContainer>
	);
};

export default ManagerDashboard;
