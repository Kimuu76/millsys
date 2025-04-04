/** @format */
import React, { useEffect, useState } from "react";
import {
	Button,
	Typography,
	List,
	ListItem,
	ListItemText,
	Divider,
	Paper,
	Snackbar,
	Alert,
} from "@mui/material";
import styled from "styled-components";
import API_BASE_URL from "../config";

const Container = styled.div`
	padding: 20px;
`;

const BackupMaintenance = () => {
	const [backups, setBackups] = useState([]);
	const [error, setError] = useState([]);
	const [loading, setLoading] = useState(false);
	const [snackbar, setSnackbar] = useState({
		open: false,
		message: "",
		severity: "success",
	});

	useEffect(() => {
		fetchBackups();
	}, []);

	const fetchBackups = async () => {
		try {
			const token = localStorage.getItem("token");
			const response = await fetch(`${API_BASE_URL}/api/superadmin/backups`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await response.json();

			console.log("✅ Available Backups:", data);

			if (response.ok) {
				setBackups(data);
			} else {
				setError(data.error || "No backups found");
			}
		} catch (error) {
			console.error("❌ Error fetching backups:", error);
			setError("Failed to fetch backups");
		}
	};

	const handleBackup = async () => {
		setLoading(true);
		try {
			const token = localStorage.getItem("token");
			const response = await fetch(`${API_BASE_URL}/api/superadmin/backup`, {
				method: "POST",
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await response.json();
			setSnackbar({ open: true, message: data.message, severity: "success" });
			fetchBackups();
		} catch (error) {
			setSnackbar({
				open: true,
				message: "❌ Backup failed!",
				severity: "error",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleRestore = async (backupFile) => {
		if (!window.confirm("⚠️ Are you sure you want to restore this backup?"))
			return;
		setLoading(true);
		try {
			const token = localStorage.getItem("token");
			const response = await fetch(`${API_BASE_URL}/api/superadmin/restore`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ backupFile }),
			});
			const data = await response.json();
			setSnackbar({ open: true, message: data.message, severity: "success" });
		} catch (error) {
			setSnackbar({
				open: true,
				message: "❌ Restore failed!",
				severity: "error",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleClearLogs = async () => {
		if (
			!window.confirm(
				"⚠️ Are you sure you want to clear logs older than 30 days?"
			)
		)
			return;
		setLoading(true);
		try {
			const token = localStorage.getItem("token");
			const response = await fetch(
				`${API_BASE_URL}/api/superadmin/clear-logs`,
				{
					method: "POST",
					headers: { Authorization: `Bearer ${token}` },
				}
			);
			const data = await response.json();
			setSnackbar({ open: true, message: data.message, severity: "success" });
		} catch (error) {
			setSnackbar({
				open: true,
				message: "❌ Failed to clear logs!",
				severity: "error",
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<Container>
			<Typography variant='h4' gutterBottom>
				Backup & Maintenance
			</Typography>

			<Button
				variant='contained'
				color='primary'
				onClick={handleBackup}
				disabled={loading}
			>
				{loading ? "Processing..." : "Create Backup"}
			</Button>

			<Button
				variant='outlined'
				color='secondary'
				onClick={handleClearLogs}
				style={{ marginLeft: "10px" }}
				disabled={loading}
			>
				Clear Old Logs
			</Button>

			<Typography variant='h6' style={{ marginTop: "20px" }}>
				Available Backups:
			</Typography>
			<Paper elevation={3} style={{ maxHeight: "300px", overflowY: "auto" }}>
				<List>
					{backups.length === 0 ? (
						<Typography style={{ padding: "10px" }}>
							No backups available.
						</Typography>
					) : (
						backups.map((backup, index) => (
							<div key={index}>
								<ListItem>
									<ListItemText primary={backup} />
									<Button
										variant='outlined'
										color='primary'
										onClick={() => handleRestore(backup)}
									>
										Restore
									</Button>
								</ListItem>
								<Divider />
							</div>
						))
					)}
				</List>
			</Paper>

			<Snackbar
				open={snackbar.open}
				autoHideDuration={3000}
				onClose={() => setSnackbar({ ...snackbar, open: false })}
			>
				<Alert severity={snackbar.severity}>{snackbar.message}</Alert>
			</Snackbar>
		</Container>
	);
};

export default BackupMaintenance;
