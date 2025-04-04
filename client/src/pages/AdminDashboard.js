/** @format*/

import React, { useEffect, useState } from "react";
import styled from "styled-components";
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
} from "@mui/material";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from "recharts";
import API_BASE_URL from "../config";

const DashboardContainer = styled.div`
	padding: 20px;
	background-color: #f4f6f8;
	min-height: 100vh;
`;

const CardsContainer = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	gap: 20px;
	margin-bottom: 20px;
`;

const StyledCard = styled(Card)`
	background: white;
	box-shadow: 3px 5px 10px rgba(0, 0, 0, 0.15);
	text-align: center;
	border-radius: 8px;
`;

const TableWrapper = styled.div`
	margin-top: 30px;
	background: white;
	padding: 20px;
	box-shadow: 3px 5px 10px rgba(0, 0, 0, 0.15);
	border-radius: 8px;
`;

const ChartContainer = styled.div`
	background: white;
	padding: 20px;
	box-shadow: 3px 5px 10px rgba(0, 0, 0, 0.15);
	border-radius: 8px;
	margin-top: 20px;
`;

const ProfitText = styled(Typography)`
	font-size: 1.5rem;
	font-weight: bold;
	color: ${(props) => (props.isProfit ? "green" : "red")};
`;

const AdminDashboard = () => {
	const [stats, setStats] = useState(null);
	const [pendingDeletions, setPendingDeletions] = useState([]);
	const [chartData, setChartData] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	// Fetch dashboard data from backend
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
						Authorization: `Bearer ${token}`, // ✅ Send token
					},
				});

				if (!response.ok) throw new Error("Failed to fetch dashboard data");

				const data = await response.json();
				setStats(data);
				setChartData(data.salesData || []);
				setLoading(false);
			} catch (error) {
				console.error("Error fetching dashboard data:", error);
				setError("Failed to load dashboard data");
				setLoading(false);
			}
		};

		const fetchPendingDeletions = async () => {
			try {
				const response = await fetch(`${API_BASE_URL}/api/deletions/pending`);
				const data = await response.json();
				setPendingDeletions(data);
			} catch (error) {
				console.error("Error fetching pending deletions:", error);
			}
		};

		fetchDashboardData();
		fetchPendingDeletions();
		setLoading(false);
	}, []);

	// Handle Approve or Reject
	const handleReview = async (requestId, action) => {
		try {
			const response = await fetch(`${API_BASE_URL}/api/deletions/review`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ request_id: requestId, action }),
			});

			const result = await response.json();
			alert(result.message);

			// Refresh pending deletions
			setPendingDeletions((prev) => prev.filter((req) => req.id !== requestId));
		} catch (error) {
			console.error("Error reviewing deletion request:", error);
		}
	};

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
	const totalSuppliers = stats?.total_suppliers || 0;
	const totalProducts = stats?.total_products || 0;
	const profit = totalSales - (totalPurchases + totalExpenses);
	const isProfit = profit >= 0;

	return (
		<DashboardContainer>
			<h2>Admin Dashboard</h2>

			{/* Cards Section */}
			<CardsContainer>
				<StyledCard>
					<CardContent>
						<Typography variant='h5'>{stats?.total_staff}</Typography>
						<Typography variant='body2'>Total Users</Typography>
					</CardContent>
				</StyledCard>
				<StyledCard>
					<CardContent>
						<Typography variant='h5'>
							KES {totalSales.toLocaleString()}
						</Typography>
						<Typography variant='body2'>Total Sales</Typography>
					</CardContent>
				</StyledCard>
				<StyledCard>
					<CardContent>
						<Typography variant='h5'>
							KES {totalPurchases.toLocaleString()}
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
						<Typography variant='h5'>{totalProducts}</Typography>
						<Typography variant='body2'>Total Products</Typography>
					</CardContent>
				</StyledCard>
				<StyledCard>
					<CardContent>
						<Typography variant='h5'>{totalSuppliers}</Typography>
						<Typography variant='body2'>Total Farmers/Suppliers</Typography>
					</CardContent>
				</StyledCard>
				{/* Profit/Loss Card */}
				<StyledCard>
					<CardContent>
						<ProfitText isProfit={isProfit}>
							KES {profit.toLocaleString()}
						</ProfitText>
						<Typography variant='body2'>
							{isProfit ? "Net Profit" : "Net Loss"}
						</Typography>
					</CardContent>
				</StyledCard>
			</CardsContainer>

			{/* Sales & Purchases Chart */}
			<ChartContainer>
				<h3>Sales & Purchases Overview</h3>
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

export default AdminDashboard;
