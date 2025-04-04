/** @format */

import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Card, CardContent, Typography, CircularProgress } from "@mui/material";
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
	display: flex;
	gap: 20px;
	margin-bottom: 20px;
`;

const StyledCard = styled(Card)`
	flex: 1;
	background: white;
	box-shadow: 2px 4px 10px rgba(0, 0, 0, 0.1);
	text-align: center;
	border-radius: 10px;
`;

const ChartContainer = styled.div`
	background: white;
	padding: 20px;
	box-shadow: 2px 4px 10px rgba(0, 0, 0, 0.1);
	border-radius: 10px;
	margin-top: 20px;
`;

const CashierDashboard = () => {
	const [stats, setStats] = useState(null);
	const [chartData, setChartData] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

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
				console.error("Error fetching cashier dashboard data:", error);
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

	return (
		<DashboardContainer>
			<h2>Cashier Dashboard</h2>

			{/* Overview Cards */}
			<CardsContainer>
				<StyledCard>
					<CardContent>
						<Typography variant='h5'>KES {stats?.total_sales || 0}</Typography>
						<Typography variant='body2'>Total Sales</Typography>
					</CardContent>
				</StyledCard>
				<StyledCard>
					<CardContent>
						<Typography variant='h5'>{stats?.total_products || 0}</Typography>
						<Typography variant='body2'>Total Products</Typography>
					</CardContent>
				</StyledCard>
			</CardsContainer>

			{/* Sales Performance Chart */}
			<ChartContainer>
				<h3>Sales Performance</h3>
				<ResponsiveContainer width='100%' height={300}>
					<BarChart data={chartData}>
						<XAxis dataKey='month' />
						<YAxis />
						<Tooltip />
						<Legend />
						<Bar dataKey='sales' fill='#007bff' />
					</BarChart>
				</ResponsiveContainer>
			</ChartContainer>
		</DashboardContainer>
	);
};

export default CashierDashboard;
