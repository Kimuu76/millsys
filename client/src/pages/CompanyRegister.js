/** @format */
import React, { useState } from "react";
import {
	Container,
	TextField,
	Button,
	Typography,
	Box,
	Alert,
	CircularProgress,
	Paper,
	Grid,
	Snackbar,
} from "@mui/material";
import styled from "styled-components";
import API_BASE_URL from "../config";

// 🔹 Styled Components
const PageWrapper = styled.div`
	padding: 20px;
	background-color: #f4f6f8;
	min-height: 100vh;
`;

const FormCard = styled(Paper)`
	padding: 30px;
	width: 100%;
	max-width: 800px;
	margin: auto;
	box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
	border-radius: 10px;
`;

const RegisterButton = styled(Button)`
	margin-top: 20px;
	padding: 12px;
	font-size: 16px;
	font-weight: bold;
	text-transform: uppercase;
`;

const CompanyRegistration = () => {
	// ✅ State for form fields
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		phone: "",
		address: "",
		owner_name: "",
		admin_username: "",
		admin_password: "",
	});

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [success, setSuccess] = useState(null);
	const [snackbar, setSnackbar] = useState({
		open: false,
		message: "",
		severity: "success",
	});

	// ✅ Handle Input Change
	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	// ✅ Handle Form Submission
	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError(null);
		setSuccess(null);

		try {
			const response = await fetch(`${API_BASE_URL}/api/companies/register`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formData),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Company registration failed");
			}

			setSuccess("✅ Company registered successfully!");
			setSnackbar({
				open: true,
				message: "Company registered successfully!",
				severity: "success",
			});

			// Reset form after success
			setFormData({
				name: "",
				email: "",
				phone: "",
				address: "",
				owner_name: "",
				admin_username: "",
				admin_password: "",
			});
		} catch (err) {
			setError(err.message);
			setSnackbar({ open: true, message: err.message, severity: "error" });
		} finally {
			setLoading(false);
		}
	};

	return (
		<PageWrapper>
			<Container maxWidth='md'>
				<FormCard elevation={3}>
					<Typography variant='h4' gutterBottom align='center'>
						Register a New Business
					</Typography>
					<Typography
						variant='body1'
						color='textSecondary'
						mb={2}
						align='center'
					>
						Enter Business details to create an admin account.
					</Typography>

					{/* ✅ Success & Error Messages */}
					{success && <Alert severity='success'>{success}</Alert>}
					{error && <Alert severity='error'>{error}</Alert>}

					<form onSubmit={handleSubmit}>
						<Grid container spacing={2}>
							<Grid item xs={12} sm={6}>
								<TextField
									label='Business Name'
									name='name'
									fullWidth
									required
									value={formData.name}
									onChange={handleChange}
								/>
							</Grid>
							<Grid item xs={12} sm={6}>
								<TextField
									label='Business Email'
									name='email'
									type='email'
									fullWidth
									required
									value={formData.email}
									onChange={handleChange}
								/>
							</Grid>
							<Grid item xs={12} sm={6}>
								<TextField
									label='Phone Number'
									name='phone'
									fullWidth
									required
									value={formData.phone}
									onChange={handleChange}
								/>
							</Grid>
							<Grid item xs={12} sm={6}>
								<TextField
									label='Business Address'
									name='address'
									fullWidth
									required
									value={formData.address}
									onChange={handleChange}
								/>
							</Grid>
							<Grid item xs={12}>
								<TextField
									label="Owner's Name"
									name='owner_name'
									fullWidth
									required
									value={formData.owner_name}
									onChange={handleChange}
								/>
							</Grid>

							{/* ✅ Admin User Details */}
							<Grid item xs={12}>
								<Typography variant='h6'>🔐 Admin User Account</Typography>
							</Grid>
							<Grid item xs={12} sm={6}>
								<TextField
									label='Admin Username'
									name='admin_username'
									fullWidth
									required
									value={formData.admin_username}
									onChange={handleChange}
								/>
							</Grid>
							<Grid item xs={12} sm={6}>
								<TextField
									label='Admin Password'
									name='admin_password'
									type='password'
									fullWidth
									required
									value={formData.admin_password}
									onChange={handleChange}
								/>
							</Grid>
						</Grid>

						<Box mt={3} display='flex' justifyContent='center'>
							<RegisterButton
								type='submit'
								variant='contained'
								color='primary'
								disabled={loading}
							>
								{loading ? (
									<CircularProgress size={24} color='inherit' />
								) : (
									"Register Business"
								)}
							</RegisterButton>
						</Box>
					</form>
				</FormCard>
			</Container>

			{/* Snackbar Notifications */}
			<Snackbar
				open={snackbar.open}
				autoHideDuration={3000}
				onClose={() => setSnackbar({ ...snackbar, open: false })}
			>
				<Alert severity={snackbar.severity}>{snackbar.message}</Alert>
			</Snackbar>
		</PageWrapper>
	);
};

export default CompanyRegistration;
