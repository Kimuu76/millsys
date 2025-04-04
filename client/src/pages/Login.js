/** @format */

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Typography from "@mui/material/Typography";
import styled, { keyframes } from "styled-components";
import API_BASE_URL from "../config";

// Animation for smooth fade-in effect
const fadeIn = keyframes`
	from {
		opacity: 0;
		transform: translateY(-10px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
`;

// Loading Spinner Animation
const spin = keyframes`
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
`;

// Page Layout
const PageContainer = styled.div`
	display: flex;
	height: 100vh;
	background: linear-gradient(to right, #002f6c, #0057b7);
	color: white;
	overflow: hidden;

	@media (max-width: 768px) {
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}
`;

const InfoSection = styled.div`
	flex: 1.2;
	display: flex;
	flex-direction: column;
	justify-content: center;
	padding: 3rem;
	animation: ${fadeIn} 1s ease-in-out;

	@media (max-width: 768px) {
		display: none; /* Hide InfoSection on mobile */
	}
`;

const LoginSection = styled.div`
	flex: 0.8;
	display: flex;
	justify-content: center;
	align-items: center;
	background: white;
	padding: 2rem;
	position: relative;

	@media (max-width: 768px) {
		padding: 1.5rem;
		flex: 1;
	}
`;

const Card = styled.div`
	background: white;
	padding: 2.5rem;
	border-radius: 10px;
	box-shadow: 0px 6px 12px rgba(0, 0, 0, 0.15);
	width: 400px;
	text-align: center;
	color: black;
	animation: ${fadeIn} 1.2s ease-in-out;
	border-top: 5px solid #007bff; /* Adds a primary-colored accent on top */

	@media (max-width: 480px) {
		width: 90%;
	}

	.mobile-only {
		display: none;
	}

	@media (max-width: 768px) {
		.mobile-only {
			display: block;
			margin-bottom: 1rem;
		}
	}

	h2 {
		color: #007bff; /* Primary blue for headings */
		margin-bottom: 1rem;
	}

	h1 {
		color: #007bff; /* Primary blue for mobile titles */
	}

	p {
		color: #333; /* Dark gray for contrast */
	}

	ul {
		list-style: none;
		padding: 0;
		color: #555; /* Medium gray for softer text */
		font-size: 14px;
		text-align: left;
		margin-top: 1rem;
	}

	ul li::before {
		content: "✔";
		color: #007bff;
		font-weight: bold;
		margin-right: 10px;
	}
`;

const Input = styled.input`
	width: 100%;
	padding: 12px;
	margin: 12px 0;
	border: 1px solid #ccc;
	border-radius: 5px;
	font-size: 16px;
	transition: border 0.3s ease-in-out;
	box-shadow: inset 0px 1px 3px rgba(0, 0, 0, 0.1); /* Preserving original UI */

	&:focus {
		border-color: #007bff;
		outline: none;
		box-shadow: 0px 0px 8px rgba(0, 123, 255, 0.3);
	}

	@media (max-width: 480px) {
		font-size: 14px;
		padding: 10px;
	}
`;

const Button = styled.button`
	background: ${({ loading }) => (loading ? "#cccccc" : "#007bff")};
	color: white;
	padding: 12px;
	border: none;
	border-radius: 5px;
	font-size: 16px;
	cursor: ${({ loading }) => (loading ? "not-allowed" : "pointer")};
	width: 100%;
	margin-top: 10px;
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 10px;

	&:hover {
		background: ${({ loading }) => (loading ? "#cccccc" : "#0056b3")};
		transform: ${({ loading }) => (loading ? "none" : "translateY(-2px)")};
		box-shadow: ${({ loading }) =>
			loading ? "none" : "0px 4px 8px rgba(0, 0, 0, 0.2)"};
	}

	@media (max-width: 480px) {
		font-size: 14px;
		padding: 10px;
	}
`;

// Spinner Style
const Spinner = styled.div`
	border: 4px solid rgba(255, 255, 255, 0.3);
	border-top: 4px solid #fff;
	border-radius: 50%;
	width: 18px;
	height: 18px;
	animation: ${spin} 1s linear infinite;
`;

const ErrorText = styled.p`
	color: red;
	font-size: 14px;
	margin-top: 10px;
	background: rgba(221, 14, 14, 0.5); /* Light red background */
	padding: 10px;
	border-radius: 5px;
	animation: ${fadeIn} 0.5s ease-in-out;
`;

const ForgotPassword = styled.p`
	color: #007bff;
	cursor: pointer;
	font-size: 14px;
	margin-top: 10px;

	&:hover {
		text-decoration: underline;
	}
`;

const Login = () => {
	const { login } = useAuth();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	const handleLogin = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		try {
			const response = await fetch(
				`${API_BASE_URL}/api/auth/login`,

				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						username,
						password,
					}),
				}
			);
			const data = await response.json();
			console.log(data);

			if (!response.ok) {
				setError(data.error || "Invalid credentials! Please try again.");
				setLoading(false);
				return;
			}

			// Show success message before redirect
			setError("");
			alert("✅ Login successful! Redirecting...");

			// Simulate a delay for smoother UX
			setTimeout(() => {
				login(data.token, data.role);

				if (data.role === "Admin") navigate("/admin-dashboard");
				else if (data.role === "Manager") navigate("/manager-dashboard");
				else if (data.role === "Cashier") navigate("/cashier-dashboard");
				else if (data.role === "SuperAdmin") navigate("/superadmin-dashboard");
				else navigate("/");
			}, 1500);
		} catch (error) {
			setError("Server error! Please try again later.");
			setLoading(false);
		}
	};

	return (
		<PageContainer>
			{/* Left Section: POS System Overview */}
			<InfoSection>
				<h1>Welcome to KevTech System</h1>
				<p>
					A comprehensive **Milk Cooler Business System** designed for **milk
					collection centers, distributors, and dairy businesses**. Efficiently
					manage **milk purchases, sales, inventory, and reports** with secure
					**role-based access** for better control and transparency.
				</p>
				<h2>Key Features:</h2>
				<ul>
					<li>- Real-time Sales & Inventory Tracking.</li>
					<li>- Secure Role-based Access Control.</li>
					<li>- Comprehensive Reporting & Insights.</li>
					<li>- Streamlined Farmer/Supplier & Product Management.</li>
				</ul>
				<h1>Login to get started!</h1>
				<ul>
					<li>👉 New here? Contact Support for access.</li>
					<li>🔒 Forgot Password? Contact Support to regain access.</li>
				</ul>
				<p>
					Join Other businesses already boosting their efficiency with KevTech
					System
				</p>
			</InfoSection>

			{/* Right Section: Login Form */}
			<LoginSection>
				<Card>
					{/* Show Info Section inside the Card on mobile screens */}
					<div className='mobile-only'>
						<h1>Milk Cooler Business System</h1>
						<p>
							Efficiently manage Milk Purchases, Sales, Inventory, and Reports
							Insights.
						</p>
					</div>
					<h2>Login</h2>
					{error && <ErrorText>{error}</ErrorText>}
					<form onSubmit={handleLogin}>
						<Input
							type='text'
							placeholder='Username'
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							required
						/>
						<Input
							type='password'
							placeholder='Password'
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
						/>
						<Button type='submit' loading={loading} disabled={loading}>
							{loading ? <Spinner /> : "Login"}
						</Button>
					</form>
					<ForgotPassword
						onClick={() => alert("Contact support at (+254712992577)")}
					>
						🔒Forgot password? Click here
					</ForgotPassword>
				</Card>
			</LoginSection>
		</PageContainer>
	);
};

export default Login;
