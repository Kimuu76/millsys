/** @format */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ Import navigate for redirection
import {
	Box,
	Typography,
	TextField,
	Button,
	Alert,
	CircularProgress,
	Paper,
} from "@mui/material";
import API_BASE_URL from "../config";

const AdminChangePassword = () => {
	const [formData, setFormData] = useState({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [success, setSuccess] = useState(null);

	const navigate = useNavigate(); // ✅ Initialize navigation

	// ✅ Handle input changes
	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	// ✅ Submit form
	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError(null);
		setSuccess(null);

		// ✅ Check if new passwords match
		if (formData.newPassword !== formData.confirmPassword) {
			setError("Passwords do not match.");
			setLoading(false);
			return;
		}

		try {
			const token = localStorage.getItem("token"); // ✅ Get auth token

			const response = await fetch(
				`${API_BASE_URL}/api/companies/change-password`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({
						currentPassword: formData.currentPassword,
						newPassword: formData.newPassword,
					}),
				}
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to update password");
			}

			setSuccess("✅ Password updated successfully! Redirecting to login...");

			// ✅ Clear token & logout after a short delay
			setTimeout(() => {
				localStorage.removeItem("token"); // ✅ Remove stored token
				navigate("/"); // ✅ Redirect to login page
			}, 3000);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Box sx={{ maxWidth: 400, margin: "auto", mt: 5 }}>
			<Paper sx={{ p: 4, boxShadow: 3 }}>
				<Typography variant='h5' textAlign='center' gutterBottom>
					Change Password
				</Typography>

				{/* ✅ Success Message */}
				{success && <Alert severity='success'>{success}</Alert>}

				{/* ❌ Error Message */}
				{error && <Alert severity='error'>{error}</Alert>}

				<form onSubmit={handleSubmit}>
					<TextField
						label='Current Password'
						name='currentPassword'
						type='password'
						fullWidth
						required
						margin='normal'
						value={formData.currentPassword}
						onChange={handleChange}
					/>
					<TextField
						label='New Password'
						name='newPassword'
						type='password'
						fullWidth
						required
						margin='normal'
						value={formData.newPassword}
						onChange={handleChange}
					/>
					<TextField
						label='Confirm New Password'
						name='confirmPassword'
						type='password'
						fullWidth
						required
						margin='normal'
						value={formData.confirmPassword}
						onChange={handleChange}
					/>

					<Box mt={3}>
						<Button type='submit' variant='contained' color='primary' fullWidth>
							{loading ? (
								<CircularProgress size={24} color='inherit' />
							) : (
								"Update Password"
							)}
						</Button>
					</Box>
				</form>
			</Paper>
		</Box>
	);
};

export default AdminChangePassword;
