/** @format */
import React, { useEffect, useState } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	Button,
	Typography,
	Snackbar,
	Alert,
} from "@mui/material";
import styled from "styled-components";
import API_BASE_URL from "../config";

const Container = styled.div`
	padding: 20px;
`;

const AdminManagement = () => {
	const [admins, setAdmins] = useState([]);
	const [error, setError] = useState(null);
	const [snackbar, setSnackbar] = useState({
		open: false,
		message: "",
		severity: "success",
	});

	// ✅ Fetch Admin Users
	useEffect(() => {
		const fetchAdmins = async () => {
			const token = localStorage.getItem("token");
			if (!token) {
				setError("⚠️ Not authorized");
				return;
			}

			try {
				const response = await fetch(`${API_BASE_URL}/api/superadmin/admins`, {
					headers: { Authorization: `Bearer ${token}` },
				});

				if (!response.ok) {
					throw new Error("Failed to fetch admins");
				}

				const data = await response.json();
				setAdmins(data);
			} catch (err) {
				setError(err.message);
			}
		};

		fetchAdmins();
	}, []);

	// ✅ Delete Admin
	const handleDelete = async (id) => {
		if (
			!window.confirm(
				"⚠️ Are you sure? This will delete the Admin & their Company!"
			)
		)
			return;

		try {
			const token = localStorage.getItem("token");
			const response = await fetch(
				`${API_BASE_URL}/api/superadmin/admins/${id}`,
				{
					method: "DELETE",
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			if (!response.ok) {
				throw new Error("Failed to delete admin & company");
			}

			setSnackbar({
				open: true,
				message: "✅ Admin & Company deleted successfully!",
				severity: "success",
			});

			// Refresh Admin List
			setAdmins((prev) => prev.filter((admin) => admin.id !== id));
		} catch (error) {
			setSnackbar({
				open: true,
				message: "❌ Error deleting admin",
				severity: "error",
			});
		}
	};

	const handleResetPassword = async (id) => {
		if (
			!window.confirm("Are you sure you want to reset this Admin's password?")
		)
			return;

		try {
			const token = localStorage.getItem("token");

			const response = await fetch(
				`${API_BASE_URL}/api/companies/reset-password/${id}`, // ✅ Ensure correct URL
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
				}
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to reset password.");
			}

			setSnackbar({
				open: true,
				message:
					"✅ Password reset successfully! Admin must change it on login.",
				severity: "success",
			});
		} catch (error) {
			setSnackbar({
				open: true,
				message: "❌ Error resetting password.",
				severity: "error",
			});
		}
	};

	return (
		<Container>
			<Typography variant='h4' gutterBottom>
				Admin Management
			</Typography>

			{/* ✅ Display Error if Any */}
			{error && <Alert severity='error'>{error}</Alert>}

			<TableContainer component={Paper} style={{ marginTop: 20 }}>
				<Table>
					<TableHead>
						<TableRow>
							<TableCell>ID</TableCell>
							<TableCell>Username</TableCell>
							<TableCell>Business</TableCell>
							<TableCell>Location</TableCell>
							<TableCell>Actions</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{admins.map((admin) => (
							<TableRow key={admin.id}>
								<TableCell>{admin.id}</TableCell>
								<TableCell>{admin.username}</TableCell>
								<TableCell>{admin.company_name}</TableCell>
								<TableCell>{admin.company_address}</TableCell>
								{/* ✅ Show Company Name */}
								<TableCell>
									<Button
										color='secondary'
										onClick={() => handleResetPassword(admin.id)}
									>
										Reset Password
									</Button>
									<Button
										color='secondary'
										onClick={() => handleDelete(admin.id)}
									>
										Delete
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>

			{/* ✅ Snackbar Notifications */}
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

export default AdminManagement;
