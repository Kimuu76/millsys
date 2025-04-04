/** @format */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { Card, CardContent, Typography, CircularProgress } from "@mui/material";
import API_BASE_URL from "../config";

const DashboardContainer = styled.div`
	display: flex;
	height: 100vh;
`;

const Content = styled.div`
	flex: 1;
	padding: 20px;
	background-color: #f4f6f8;
`;

const CardsContainer = styled.div`
	display: flex;
	gap: 20px;
	flex-wrap: wrap;
	margin-bottom: 20px;
`;

const StyledCard = styled(Card)`
	flex: 1;
	min-width: 200px;
	background: white;
	box-shadow: 2px 4px 10px rgba(0, 0, 0, 0.1);
	text-align: center;
`;

const SuperAdminDashboard = () => {
	const navigate = useNavigate();
	const [stats, setStats] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		const fetchStats = async () => {
			try {
				const token = localStorage.getItem("token");
				console.log("🔹 Token:", token); // ✅ Debug token

				if (!token) {
					navigate("/login");
					return;
				}

				const response = await fetch(`${API_BASE_URL}/api/superadmin/stats`, {
					headers: { Authorization: `Bearer ${token}` },
				});

				if (!response.ok) {
					throw new Error("Failed to fetch stats");
				}

				const data = await response.json();
				console.log("✅ Super Admin Stats:", data);
				setStats(data);
				setLoading(false);
			} catch (error) {
				console.error("❌ Error fetching SuperAdmin stats:", error);
				setError(error.message);
				setLoading(false);
			}
		};

		fetchStats();
	}, [navigate]);

	if (loading) {
		return (
			<DashboardContainer>
				<Content>
					<Typography variant='h5'>Loading Dashboard...</Typography>
					<CircularProgress />
				</Content>
			</DashboardContainer>
		);
	}

	if (error) {
		return (
			<DashboardContainer>
				<Content>
					<Typography variant='h5' color='error'>
						Error: {error}
					</Typography>
				</Content>
			</DashboardContainer>
		);
	}

	return (
		<DashboardContainer>
			<Content>
				<Typography variant='h4'>Super Admin Dashboard</Typography>
				<CardsContainer>
					<StyledCard>
						<CardContent>
							<Typography variant='h5'>{stats?.total_companies}</Typography>
							<Typography variant='body2'>Total business</Typography>
						</CardContent>
					</StyledCard>
					<StyledCard>
						<CardContent>
							<Typography variant='h5'>{stats?.total_admins}</Typography>
							<Typography variant='body2'>Total Business Admins</Typography>
						</CardContent>
					</StyledCard>
				</CardsContainer>
			</Content>
		</DashboardContainer>
	);
};

export default SuperAdminDashboard;
