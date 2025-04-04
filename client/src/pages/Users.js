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
	TextField,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	MenuItem,
	Snackbar,
	Alert,
} from "@mui/material";
import styled from "styled-components";
import API_BASE_URL from "../config";

const Container = styled.div`
	padding: 20px;
`;

const Users = () => {
	const [users, setUsers] = useState([]);
	const filteredUsers = users
		? users.filter((user) => user.role !== "Admin")
		: [];
	const [search, setSearch] = useState("");
	const [open, setOpen] = useState(false);
	const [newUser, setNewUser] = useState({
		username: "",
		password: "",
		role: "Cashier",
	});
	const [snackbar, setSnackbar] = useState({
		open: false,
		message: "",
		severity: "success",
	});

	useEffect(() => {
		fetchUsers();
	}, []);

	const fetchUsers = async () => {
		const token = localStorage.getItem("token");

		if (!token) {
			console.error("⚠️ No token found. User must log in.");
			return;
		}

		try {
			const response = await fetch(`${API_BASE_URL}/api/users`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`, // ✅ Send token for authentication
				},
			});

			if (!response.ok) {
				throw new Error(`Server responded with ${response.status}`);
			}

			const data = await response.json();
			setUsers(data); // ✅ Ensure users is an array
		} catch (error) {
			console.error("❌ Error fetching users:", error.message);
		}
	};

	const handleAddUser = async () => {
		try {
			const token = localStorage.getItem("token"); // ✅ Get token from storage
			const response = await fetch(`${API_BASE_URL}/api/users`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`, // ✅ Add token for authentication
				},
				body: JSON.stringify(newUser),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to add user");
			}

			fetchUsers();
			setOpen(false);
			setNewUser({ username: "", password: "", role: "Cashier" });
		} catch (error) {
			console.error("Error adding user:", error);
			alert(error.message); // ✅ Show exact error
		}
	};

	const handleDelete = async (id) => {
		if (!window.confirm("Are you sure you want to delete this user?")) return;

		try {
			await fetch(`${API_BASE_URL}/api/users/${id}`, {
				method: "DELETE",
			});
			setSnackbar({
				open: true,
				message: "User deleted successfully!",
				severity: "success",
			});
			fetchUsers();
		} catch (error) {
			console.error("Error deleting user:", error);
			setSnackbar({
				open: true,
				message: "Error deleting user",
				severity: "error",
			});
		}
	};

	return (
		<Container>
			<h2>User Management</h2>

			<TextField
				label='Search Users'
				variant='outlined'
				fullWidth
				margin='normal'
				onChange={(e) => setSearch(e.target.value)}
			/>

			{/*<Button variant='contained' color='primary' onClick={() => setOpen(true)}>
				Add User
			</Button>*/}

			<TableContainer
				component={Paper}
				style={{ maxHeight: "400px", overflowY: "auto" }}
			>
				<Table stickyHeader>
					<TableHead>
						<TableRow>
							<TableCell>ID</TableCell>
							<TableCell>Username</TableCell>
							<TableCell>Role</TableCell>
							<TableCell>Actions</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{users
							.filter((user) =>
								user.username.toLowerCase().includes(search.toLowerCase())
							)
							.map((user) => (
								<TableRow key={user.id}>
									<TableCell>{user.id}</TableCell>
									<TableCell>{user.username}</TableCell>
									<TableCell>{user.role}</TableCell>
									<TableCell>
										<Button
											color='secondary'
											onClick={() => handleDelete(user.id)}
										>
											Delete
										</Button>
									</TableCell>
								</TableRow>
							))}
					</TableBody>
				</Table>
			</TableContainer>

			{/* Add User Dialog */}
			<Dialog open={open} onClose={() => setOpen(false)}>
				<DialogTitle>Add New User</DialogTitle>
				<DialogContent>
					<TextField
						label='Username'
						fullWidth
						margin='dense'
						value={newUser.username}
						onChange={(e) =>
							setNewUser({ ...newUser, username: e.target.value })
						}
					/>
					<TextField
						label='Password'
						fullWidth
						margin='dense'
						type='password'
						value={newUser.password}
						onChange={(e) =>
							setNewUser({ ...newUser, password: e.target.value })
						}
					/>
					<TextField
						select
						label='Role'
						fullWidth
						margin='dense'
						value={newUser.role}
						onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
					>
						<MenuItem value='Cashier'>Cashier</MenuItem>
						<MenuItem value='Admin'>Admin</MenuItem>
						<MenuItem value='Manager'>Manager</MenuItem>
					</TextField>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setOpen(false)}>Cancel</Button>
					<Button onClick={handleAddUser} color='primary'>
						Add
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
		</Container>
	);
};

export default Users;
