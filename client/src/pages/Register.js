/** @format */

import React, { useState } from "react";
import {
	TextField,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	MenuItem,
	Snackbar,
	Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config";

const Register = () => {
	const [open, setOpen] = useState(true); // Open the dialog by default
	const [user, setUser] = useState({
		username: "",
		password: "",
		role: "Cashier",
	});
	const [snackbar, setSnackbar] = useState({
		open: false,
		message: "",
		severity: "success",
	});
	const navigate = useNavigate();

	const handleRegister = async () => {
		const token = localStorage.getItem("token"); // ✅ Get stored token
		const company_id = localStorage.getItem("company_id"); // ✅ Get stored company ID

		if (!token || !company_id) {
			setSnackbar({
				open: true,
				message: "Unauthorized. Please log in again.",
				severity: "error",
			});
			return;
		}

		// ✅ Ensure all fields are filled
		if (!user.username || !user.password || !user.role) {
			setSnackbar({
				open: true,
				message: "All fields are required.",
				severity: "error",
			});
			return;
		}

		try {
			const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`, // ✅ Send token for authentication
				},
				body: JSON.stringify({
					...user,
					company_id: parseInt(company_id), // ✅ Ensure company_id is included
				}),
			});

			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Registration failed");

			setSnackbar({
				open: true,
				message: "✅ User registered successfully!",
				severity: "success",
			});

			setTimeout(() => {
				setOpen(false);
				navigate("/users"); // ✅ Redirect to users page after registration
			}, 2000);
		} catch (error) {
			setSnackbar({ open: true, message: error.message, severity: "error" });
		}
	};

	return (
		<>
			{/* Register Dialog */}
			<Dialog open={open} onClose={() => navigate("/login")}>
				<DialogTitle>Register New User</DialogTitle>
				<DialogContent>
					<TextField
						label='Username'
						fullWidth
						margin='dense'
						value={user.username}
						onChange={(e) => setUser({ ...user, username: e.target.value })}
					/>
					<TextField
						label='Password'
						fullWidth
						margin='dense'
						type='password'
						value={user.password}
						onChange={(e) => setUser({ ...user, password: e.target.value })}
					/>
					<TextField
						select
						label='Role'
						fullWidth
						margin='dense'
						value={user.role}
						onChange={(e) => setUser({ ...user, role: e.target.value })}
					>
						<MenuItem value='Cashier'>Cashier</MenuItem>
						<MenuItem value='Manager'>Manager</MenuItem>
					</TextField>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => navigate("/users")}>Cancel</Button>
					<Button onClick={handleRegister} color='primary' variant='contained'>
						Register
					</Button>
				</DialogActions>
			</Dialog>

			{/* Snackbar Notifications */}
			<Snackbar
				open={snackbar.open}
				autoHideDuration={3000}
				onClose={() => setSnackbar({ ...snackbar, open: false })}
			>
				<Alert severity={snackbar.severity}>{snackbar.message}</Alert>
			</Snackbar>
		</>
	);
};

export default Register;
