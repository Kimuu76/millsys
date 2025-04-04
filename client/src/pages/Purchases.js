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
	CircularProgress,
} from "@mui/material";
import styled from "styled-components";
import { Autocomplete } from "@mui/material";
import API_BASE_URL from "../config";
import PurchaseReceipt from "../components/PurchaseReceipt";

const Container = styled.div`
	padding: 20px;
`;

const Purchases = () => {
	const [purchases, setPurchases] = useState([]);
	const [products, setProducts] = useState([]);
	const [suppliers, setSuppliers] = useState([]);
	const [search, setSearch] = useState("");
	const [open, setOpen] = useState(false);
	const [receiptData, setReceiptData] = useState(null);
	const [openReceipt, setOpenReceipt] = useState(false);

	const [loading, setLoading] = useState(true);
	const [newPurchase, setNewPurchase] = useState({
		product_name: "",
		supplier_id: "",
		quantity: "",
		purchase_price: 0,
		total: 0,
	});
	const [openReturnDialog, setOpenReturnDialog] = useState(false);
	const [returnData, setReturnData] = useState({ id: "", return_quantity: "" });

	useEffect(() => {
		fetchPurchases();
		fetchProducts();
		fetchSuppliers();
	}, []);

	const fetchPurchases = async () => {
		try {
			const token = localStorage.getItem("token");

			if (!token) {
				console.error("⚠️ No token found. User must log in.");
				return;
			}

			const response = await fetch(`${API_BASE_URL}/api/purchases`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`, // ✅ Include authentication token
				},
			});

			const data = await response.json();

			// ✅ Ensure return_quantity is included in each purchase
			setPurchases(
				Array.isArray(data)
					? data.map((purchase) => ({
							...purchase,
							return_quantity: purchase.return_quantity || 0, // Default to 0 if missing
					  }))
					: []
			);
		} catch (error) {
			console.error("❌ Error fetching purchases:", error);
			setPurchases([]);
		}
	};

	const fetchProducts = async () => {
		const token = localStorage.getItem("token"); // 🔥 Get the token

		if (!token) {
			console.error("⚠️ No token found. User must log in.");
			return;
		}

		try {
			const response = await fetch(`${API_BASE_URL}/api/products`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`, // 🔥 Include Token Here
				},
			});

			if (!response.ok) {
				throw new Error(`Server responded with ${response.status}`);
			}

			const data = await response.json();
			console.log("✅ Products:", data);

			// 🔥 Ensure state is updated
			setProducts(data);
		} catch (error) {
			console.error("❌ Error fetching products:", error.message);
		}
	};

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

	const handleProductChange = async (e) => {
		const selectedProduct = e.target.value;
		setNewPurchase({ ...newPurchase, product_name: selectedProduct });

		try {
			const token = localStorage.getItem("token");

			if (!token) {
				console.error("⚠️ No token found. User must log in.");
				return;
			}

			const response = await fetch(
				`${API_BASE_URL}/api/products/${selectedProduct}`,
				{
					method: "GET",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`, // ✅ Include token for authentication
					},
				}
			);

			const data = await response.json();

			if (data.purchase_price) {
				setNewPurchase((prev) => ({
					...prev,
					purchase_price: data.purchase_price,
					total: data.purchase_price * (prev.quantity || 0),
				}));
			}
		} catch (error) {
			console.error("❌ Error fetching product price:", error);
		}
	};

	const handleQuantityChange = (e) => {
		const quantity = Number(e.target.value);
		setNewPurchase((prev) => ({
			...prev,
			quantity,
			total: prev.purchase_price * quantity,
		}));
	};

	const handleCreatePurchase = async () => {
		if (
			!newPurchase.product_name ||
			!newPurchase.supplier_id ||
			!newPurchase.quantity
		) {
			return alert("Please fill all fields!");
		}

		try {
			const token = localStorage.getItem("token");

			if (!token) {
				console.error("⚠️ No token found. User must log in.");
				return;
			}

			await fetch(`${API_BASE_URL}/api/purchases`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`, // ✅ Secure API call
				},
				body: JSON.stringify(newPurchase),
			});

			fetchPurchases();
			setOpen(false);
			setNewPurchase({
				product_name: "",
				supplier_id: "",
				quantity: "",
				purchase_price: 0,
				total: 0,
			});

			const data = await fetch.json();

			if (!fetch.ok) {
				const { name, address, phone } = data.company;
			}
		} catch (error) {
			console.error("❌ Error adding purchase:", error);
		}
	};

	const markAsPaid = async (id) => {
		if (!window.confirm("Are you sure you want to mark this as Paid?")) return;

		try {
			const token = localStorage.getItem("token");

			if (!token) {
				console.error("⚠️ No token found. User must log in.");
				return;
			}

			const response = await fetch(`${API_BASE_URL}/api/purchases/${id}/pay`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`, // ✅ Secure API call
				},
			});

			if (!response.ok) {
				// ✅ Extract company details from API response

				throw new Error("Failed to update purchase status.");
			}

			// ✅ Update the UI immediately after marking as paid
			setPurchases((prevPurchases) =>
				prevPurchases.map((purchase) =>
					purchase.id === id ? { ...purchase, status: "Paid" } : purchase
				)
			);

			console.log("✅ Purchase marked as Paid successfully.");
		} catch (error) {
			console.error("❌ Error updating purchase status:", error);
		}
	};

	const handleReturnPurchase = async () => {
		if (!returnData.return_quantity || returnData.return_quantity <= 0) {
			return alert("Enter a valid return quantity.");
		}

		try {
			const token = localStorage.getItem("token");

			if (!token) {
				console.error("⚠️ No token found. User must log in.");
				return;
			}

			await fetch(`${API_BASE_URL}/api/purchases/${returnData.id}/return`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ return_quantity: returnData.return_quantity }),
			});

			fetchPurchases(); // Refresh data
			setOpenReturnDialog(false);
			setReturnData({ id: "", return_quantity: "" });
		} catch (error) {
			console.error("❌ Error processing return:", error);
		}
	};

	const handleGenerateReceipt = (purchase) => {
		setReceiptData(purchase);
		setOpenReceipt(true);
	};

	const handleDelete = async (id) => {
		if (!window.confirm("Are you sure you want to delete this purchase?"))
			return;

		try {
			const token = localStorage.getItem("token");

			if (!token) {
				console.error("⚠️ No token found. User must log in.");
				return;
			}

			await fetch(`${API_BASE_URL}/api/purchases/${id}`, {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`, // ✅ Secure deletion
				},
			});
			fetchPurchases();
		} catch (error) {
			console.error("❌ Error deleting purchase:", error);
		}
	};

	return (
		<Container>
			<h2>Purchases Management</h2>
			<TextField
				label='Search Purchases'
				variant='outlined'
				fullWidth
				margin='normal'
				onChange={(e) => setSearch(e.target.value)}
			/>
			<Button variant='contained' color='primary' onClick={() => setOpen(true)}>
				Add Purchase
			</Button>

			{loading ? (
				<CircularProgress style={{ marginTop: 20 }} />
			) : purchases.length === 0 ? (
				<p style={{ marginTop: 20, textAlign: "center" }}>
					No purchases found.
				</p>
			) : (
				<TableContainer
					component={Paper}
					style={{ maxHeight: "400px", overflowY: "auto" }}
				>
					<Table stickyHeader>
						<TableHead>
							<TableRow>
								<TableCell>ID</TableCell>
								<TableCell>Product</TableCell>
								<TableCell>Farmer</TableCell>
								<TableCell>Contact</TableCell>
								<TableCell>Location</TableCell>
								<TableCell>Quantity(L)</TableCell>
								<TableCell>Purchase Price</TableCell>
								<TableCell>Total Price</TableCell>
								<TableCell>Date</TableCell>
								<TableCell>Status</TableCell>
								<TableCell>Actions</TableCell>
								<TableCell>Return</TableCell>
								<TableCell>Receipt</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{purchases
								.filter(
									(purchase) =>
										purchase.product_name
											?.toLowerCase()
											.includes(search.toLowerCase()) ||
										purchase.supplier_name
											?.toLowerCase()
											.includes(search.toLowerCase())
								)
								.map((purchase) => (
									<TableRow key={purchase.id}>
										<TableCell>{purchase.id}</TableCell>
										<TableCell>{purchase.product_name}</TableCell>
										<TableCell>{purchase.supplier_name}</TableCell>
										<TableCell>{purchase.supplier_contact}</TableCell>
										<TableCell>{purchase.supplier_address}</TableCell>
										<TableCell>{purchase.quantity}</TableCell>
										<TableCell>KES {purchase.purchase_price}</TableCell>
										<TableCell>KES {purchase.total}</TableCell>
										<TableCell>
											{new Date(purchase.createdAt).toLocaleString()}
										</TableCell>
										<TableCell>
											{purchase.status === "Paid" ? (
												<span style={{ color: "green", fontWeight: "bold" }}>
													Paid
												</span>
											) : (
												<Button
													color='secondary'
													onClick={() => markAsPaid(purchase.id)}
												>
													Pay
												</Button>
											)}
										</TableCell>
										<TableCell>
											<Button
												color='error'
												onClick={() => handleDelete(purchase.id)}
											>
												Delete
											</Button>
										</TableCell>
										<TableCell>
											{purchase.status === "Returned" ? (
												<span style={{ color: "red", fontWeight: "bold" }}>
													Returned{" "}
													{purchase.return_quantity &&
														`(Qty: ${purchase.return_quantity})`}
												</span>
											) : (
												<Button
													variant='outlined'
													color='error'
													onClick={() => {
														setReturnData({
															id: purchase.id,
															return_quantity: "",
														});
														setOpenReturnDialog(true);
													}}
												>
													Return
												</Button>
											)}
										</TableCell>
										<TableCell>
											<Button
												color='primary'
												onClick={() => handleGenerateReceipt(purchase)}
											>
												Generate Receipt
											</Button>
										</TableCell>
									</TableRow>
								))}
						</TableBody>
					</Table>
				</TableContainer>
			)}

			{/* Add Purchase Dialog */}
			<Dialog open={open} onClose={() => setOpen(false)}>
				<DialogTitle>Add New Purchase</DialogTitle>
				<DialogContent>
					<Autocomplete
						options={suppliers}
						getOptionLabel={(option) => option.name}
						renderInput={(params) => (
							<TextField
								{...params}
								label='Supplier'
								fullWidth
								margin='dense'
							/>
						)}
						onChange={(event, newValue) => {
							setNewPurchase({
								...newPurchase,
								supplier_id: newValue ? newValue.id : "",
							});
						}}
					/>
					<TextField
						select
						label='Product'
						fullWidth
						margin='dense'
						value={newPurchase.product_name}
						onChange={handleProductChange}
					>
						{products.map((product) => (
							<MenuItem key={product.name} value={product.name}>
								{product.name}
							</MenuItem>
						))}
					</TextField>
					<TextField
						label='Quantity(L)'
						fullWidth
						margin='dense'
						type='number'
						value={newPurchase.quantity}
						onChange={handleQuantityChange}
					/>
					<TextField
						label='Total Price (Auto-Calculated)'
						fullWidth
						margin='dense'
						type='number'
						value={newPurchase.total}
						disabled
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setOpen(false)}>Cancel</Button>
					<Button onClick={handleCreatePurchase} color='primary'>
						Add
					</Button>
				</DialogActions>
			</Dialog>
			<Dialog
				open={openReturnDialog}
				onClose={() => setOpenReturnDialog(false)}
			>
				<DialogTitle>Return Purchase</DialogTitle>
				<DialogContent>
					<TextField
						label='Return Quantity'
						type='number'
						fullWidth
						margin='normal'
						value={returnData.return_quantity}
						onChange={(e) =>
							setReturnData({ ...returnData, return_quantity: e.target.value })
						}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setOpenReturnDialog(false)} color='secondary'>
						Cancel
					</Button>
					<Button onClick={handleReturnPurchase} color='primary'>
						Return
					</Button>
				</DialogActions>
			</Dialog>
			{/* Receipt Dialog */}
			<Dialog open={openReceipt} onClose={() => setOpenReceipt(false)}>
				{receiptData && (
					<PurchaseReceipt
						purchase={receiptData}
						onClose={() => setOpenReceipt(false)}
					/>
				)}
			</Dialog>
		</Container>
	);
};

export default Purchases;
