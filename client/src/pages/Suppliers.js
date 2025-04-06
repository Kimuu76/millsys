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
	CircularProgress,
} from "@mui/material";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import styled from "styled-components";
import API_BASE_URL from "../config";

const Container = styled.div`
	padding: 20px;
`;

const Suppliers = () => {
	const [suppliers, setSuppliers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [open, setOpen] = useState(false);
	const [openSnackbar, setOpenSnackbar] = useState(false);
	const [snackbarMessage, setSnackbarMessage] = useState("");
	const [newSupplier, setNewSupplier] = useState({
		name: "",
		contact: "",
		address: "",
	});

	useEffect(() => {
		fetchSuppliers();
	}, []);

	const Alert = React.forwardRef(function Alert(props, ref) {
		return <MuiAlert elevation={6} ref={ref} variant='filled' {...props} />;
	});

	const fetchSuppliers = async () => {
		try {
			const token = localStorage.getItem("token");

			if (!token) {
				console.error("⚠️ No token found. User must log in.");
				return;
			}

			const response = await fetch(`${API_BASE_URL}/api/suppliers`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`, // ✅ Include company-restricted token
				},
			});

			const data = await response.json();
			setSuppliers(Array.isArray(data) ? data : []);
		} catch (error) {
			console.error("❌ Error fetching suppliers:", error);
			setSuppliers([]);
		} finally {
			setLoading(false);
		}
	};

	const handleAddSupplier = async () => {
		// Duplicate check by name and contact
		const isDuplicate = suppliers.some(
			(supplier) =>
				supplier.name.trim().toLowerCase() ===
					newSupplier.name.trim().toLowerCase() &&
				supplier.contact.trim() === newSupplier.contact.trim()
		);

		if (isDuplicate) {
			setSnackbarMessage(
				"⚠️ Farmer with the same name and contact already exists."
			);
			setOpenSnackbar(true);
			return; // 🚫 Stop if duplicate
		}
		try {
			const token = localStorage.getItem("token");

			if (!token) {
				console.error("⚠️ No token found. User must log in.");
				return;
			}

			await fetch(`${API_BASE_URL}/api/suppliers`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`, // ✅ Ensure only authenticated users can add
				},
				body: JSON.stringify(newSupplier),
			});

			fetchSuppliers();
			setOpen(false);
			setNewSupplier({ name: "", contact: "", address: "" });

			// Show success snackbar
			setSnackbarMessage("✅ Farmer added successfully!");
			setOpenSnackbar(true);
		} catch (error) {
			console.error("❌ Error adding supplier:", error);

			// Optional: show error message
			setSnackbarMessage("❌ Failed to add supplier.");
			setOpenSnackbar(true);
		}
	};

	const handleDelete = async (id) => {
		if (!window.confirm("Are you sure you want to delete this supplier?"))
			return;

		try {
			const token = localStorage.getItem("token");

			if (!token) {
				console.error("⚠️ No token found. User must log in.");
				return;
			}

			await fetch(`${API_BASE_URL}/api/suppliers/${id}`, {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`, // ✅ Secure API call
				},
			});

			fetchSuppliers();
		} catch (error) {
			console.error("❌ Error deleting supplier:", error);
		}
	};

	return (
		<Container>
			<h2>Farmers/Suppliers Management</h2>
			<TextField
				label='Search Suppliers'
				variant='outlined'
				fullWidth
				margin='normal'
				onChange={(e) => setSearch(e.target.value)}
			/>
			<Button variant='contained' color='primary' onClick={() => setOpen(true)}>
				Add Farmer/Supplier
			</Button>

			{loading ? (
				<CircularProgress style={{ marginTop: 20 }} />
			) : suppliers.length === 0 ? (
				<p style={{ marginTop: 20, textAlign: "center" }}>No Farmers found.</p>
			) : (
				<TableContainer
					component={Paper}
					style={{ maxHeight: "400px", overflowY: "auto" }}
				>
					<Table stickyHeader>
						<TableHead>
							<TableRow>
								<TableCell>ID</TableCell>
								<TableCell>Name</TableCell>
								<TableCell>Contact</TableCell>
								<TableCell>Location</TableCell>
								<TableCell>Actions</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{suppliers
								.filter(
									(supplier) =>
										supplier.name
											?.toLowerCase()
											.includes(search.toLowerCase()) ||
										supplier.address
											?.toLowerCase()
											.includes(search.toLowerCase())
								)
								.map((supplier) => (
									<TableRow key={supplier.id}>
										<TableCell>{supplier.id}</TableCell>
										<TableCell>{supplier.name}</TableCell>
										<TableCell>{supplier.contact}</TableCell>
										<TableCell>{supplier.address}</TableCell>
										<TableCell>
											<Button
												color='secondary'
												onClick={() => handleDelete(supplier.id)}
											>
												Delete
											</Button>
										</TableCell>
									</TableRow>
								))}
						</TableBody>
					</Table>
				</TableContainer>
			)}

			{/* Add Supplier Dialog */}
			<Dialog open={open} onClose={() => setOpen(false)}>
				<DialogTitle>Add New Farmer/Supplier</DialogTitle>
				<DialogContent>
					<TextField
						label='Name'
						fullWidth
						margin='dense'
						value={newSupplier.name}
						onChange={(e) =>
							setNewSupplier({ ...newSupplier, name: e.target.value })
						}
					/>
					<TextField
						label='Contact'
						fullWidth
						margin='dense'
						value={newSupplier.contact}
						onChange={(e) =>
							setNewSupplier({ ...newSupplier, contact: e.target.value })
						}
					/>
					<TextField
						label='Location'
						fullWidth
						margin='dense'
						value={newSupplier.address}
						onChange={(e) =>
							setNewSupplier({ ...newSupplier, address: e.target.value })
						}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setOpen(false)}>Cancel</Button>
					<Button onClick={handleAddSupplier} color='primary'>
						Add
					</Button>
				</DialogActions>
			</Dialog>
			<Snackbar
				open={openSnackbar}
				autoHideDuration={3000}
				onClose={() => setOpenSnackbar(false)}
				anchorOrigin={{ vertical: "top", horizontal: "center" }}
			>
				<Alert
					onClose={() => setOpenSnackbar(false)}
					severity='success'
					sx={{ width: "100%" }}
				>
					{snackbarMessage}
				</Alert>
			</Snackbar>
			<Snackbar
				open={openSnackbar}
				autoHideDuration={3000}
				onClose={() => setOpenSnackbar(false)}
				anchorOrigin={{ vertical: "top", horizontal: "center" }}
			>
				<Alert
					onClose={() => setOpenSnackbar(false)}
					severity={
						snackbarMessage.startsWith("✅")
							? "success"
							: snackbarMessage.startsWith("⚠️")
							? "warning"
							: "error"
					}
					sx={{ width: "100%" }}
				>
					{snackbarMessage}
				</Alert>
			</Snackbar>
		</Container>
	);
};

export default Suppliers;
