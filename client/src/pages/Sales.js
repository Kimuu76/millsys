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
	Autocomplete,
	CircularProgress,
	Card,
	CardContent,
	Typography,
	IconButton,
} from "@mui/material";
import { Add, Delete, ShoppingCart } from "@mui/icons-material"; // Icons
import styled from "styled-components";
import Receipt from "../components/Receipt";
import API_BASE_URL from "../config";

const Container = styled.div`
	padding: 20px;
`;

const Sales = () => {
	const [sales, setSales] = useState([]);
	const [search, setSearch] = useState("");
	const [products, setProducts] = useState([]);
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(true);
	const [selectedProducts, setSelectedProducts] = useState([]);
	const [totalPrice, setTotalPrice] = useState(0);
	const [receipt, setReceipt] = useState(null);
	const [salesData, setSalesData] = useState([]);
	const [receiptData, setReceiptData] = useState(null);

	useEffect(() => {
		fetchSales();
		//fetchProducts();
		fetchProductsForSale();
	}, []);

	const fetchSales = async () => {
		try {
			const token = localStorage.getItem("token"); // ✅ Get token

			const response = await fetch(`${API_BASE_URL}/api/sales`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`, // ✅ Send token
				},
			});

			const data = await response.json();
			setSales(Array.isArray(data) ? data : []);

			console.log("✅ Sales Data:", data); // ✅ Debugging
		} catch (error) {
			console.error("❌ Error fetching sales:", error);
			setSales([]);
		} finally {
			setLoading(false);
		}
	};

	const fetchProductsForSale = async () => {
		try {
			const token = localStorage.getItem("token");
			if (!token) {
				console.error("⚠️ No token found. User must log in.");
				return;
			}

			const response = await fetch(`${API_BASE_URL}/api/stock/sales-products`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
			});

			const data = await response.json();
			console.log("✅ Fetched Sales Products:", data); // 🔍 Debugging output

			// Ensure data is an array before setting state
			if (Array.isArray(data) && data.length > 0) {
				setProducts(data); // ✅ Store products in state
			} else {
				console.warn("⚠️ No products available for sale.");
				setProducts([]); // Prevents "undefined" errors
			}
		} catch (error) {
			console.error("❌ Error fetching sales products:", error);
			setProducts([]); // Ensure it's always an array
		}
	};

	const handleAddProduct = () => {
		setSelectedProducts([
			...selectedProducts,
			{ product_name: "", quantity: 1, selling_price: 0 },
		]);
	};

	const handleProductChange = (index, selectedProduct) => {
		// ✅ Ensure selectedProduct is valid
		if (!selectedProduct || !selectedProduct.product_name) {
			console.error("❌ Invalid product selected:", selectedProduct);
			return;
		}

		const updatedProducts = [...selectedProducts];
		updatedProducts[index] = {
			...updatedProducts[index], // Keep other properties
			product_name: selectedProduct.product_name,
			selling_price: selectedProduct.selling_price || 0, // ✅ Set correct selling price
			quantity: updatedProducts[index]?.quantity || 1, // Default to 1 if undefined
		};

		setSelectedProducts(updatedProducts);
		updateTotalPrice(updatedProducts);
	};

	const handleQuantityChange = (index, quantity) => {
		const updatedProducts = [...selectedProducts];
		updatedProducts[index].quantity = quantity;
		setSelectedProducts(updatedProducts);
		updateTotalPrice(updatedProducts);
	};

	const updateTotalPrice = (items) => {
		const total = items.reduce(
			(sum, item) =>
				(parseInt(item.quantity) || 0) * (parseFloat(item.selling_price) || 0) +
				sum,
			0
		);
		setTotalPrice(total);
	};

	const handleCreateSale = async () => {
		try {
			if (selectedProducts.length === 0) {
				alert("Please add at least one product.");
				return;
			}

			const token = localStorage.getItem("token"); // ✅ Retrieve token

			if (!token) {
				alert("⚠️ No token found. Please log in.");
				return;
			}

			const response = await fetch(`${API_BASE_URL}/api/sales/sale`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`, // ✅ Ensure token is sent
				},
				body: JSON.stringify({
					products: selectedProducts,
					total_price: totalPrice,
				}),
			});

			const data = await response.json();

			if (response.ok) {
				alert("✅ Sale processed successfully!");

				// ✅ Extract company details from API response
				const { name, address, phone } = data.company;

				// ✅ Generate receipt string dynamically
				const receiptId = `REC-${Math.floor(100000 + Math.random() * 900000)}`;
				let receiptText = `${name}\nAddress: ${address}\nContact: ${phone}\n\nReceipt ID: ${receiptId}\nDate: ${new Date().toLocaleString()}\n--------------------------------\n`;

				selectedProducts.forEach((item) => {
					receiptText += `${item.product_name} x ${item.quantity}L = KES ${(
						item.selling_price * item.quantity
					).toFixed(2)}\n`;
				});

				receiptText += `--------------------------------\nTOTAL: KES ${totalPrice.toFixed(
					2
				)}\n================================\nThanks and Always Welcome! 😊`;

				// ✅ Update state with the generated receipt
				setReceipt({
					text: receiptText,
					total_price: totalPrice,
				});

				fetchSales();
				setOpen(false);
				setSelectedProducts([]);
				setTotalPrice(0);
			} else {
				alert(`⚠️ Stock unavailable!! Please check Stock Quantity.`);
			}
		} catch (error) {
			console.error("❌ Error processing sale:", error);
		}
	};

	const handleDelete = async (id) => {
		if (!window.confirm("Are you sure you want to delete this sale?")) return;

		try {
			const token = localStorage.getItem("token"); // ✅ Get token

			if (!token) {
				alert("⚠️ No token found. Please log in.");
				return;
			}

			const response = await fetch(`${API_BASE_URL}/api/sales/${id}`, {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`, // ✅ Ensure token is sent
				},
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || "Failed to delete sale");
			}

			alert("✅ Sale deleted successfully!");
			fetchSales(); // ✅ Refresh sales after deletion
		} catch (error) {
			console.error("❌ Error deleting sale:", error);
			alert(`Error: ${error.message}`);
		}
	};

	return (
		<Container>
			<h2>Sales Management</h2>
			<TextField
				label='Search Sales'
				variant='outlined'
				fullWidth
				margin='normal'
				onChange={(e) => setSearch(e.target.value)}
			/>
			<Button
				variant='contained'
				color='primary'
				startIcon={<ShoppingCart />}
				onClick={() => setOpen(true)}
			>
				New Sale
			</Button>

			{loading ? (
				<CircularProgress style={{ marginTop: 20 }} />
			) : sales.length === 0 ? (
				<p style={{ marginTop: 20, textAlign: "center" }}>No sales found.</p>
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
								<TableCell>Quantity</TableCell>
								<TableCell>Total Price</TableCell>
								<TableCell>Date</TableCell>
								<TableCell>Actions</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{sales
								.filter((sale) =>
									sale.product_name
										?.toLowerCase()
										.includes(search.toLowerCase())
								)
								.map((sale) => (
									<TableRow key={sale.id}>
										<TableCell>{sale.id}</TableCell>
										<TableCell>{sale.product_name}</TableCell>
										<TableCell>{sale.quantity}</TableCell>
										<TableCell>KES {sale.total_price}</TableCell>
										<TableCell>
											{new Date(sale.sale_date).toLocaleString()}
										</TableCell>
										<TableCell>
											<Button
												color='secondary'
												onClick={() => handleDelete(sale.id)}
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

			{/* Sale Dialog */}
			<Dialog
				open={open}
				onClose={() => setOpen(false)}
				maxWidth='sm'
				fullWidth
			>
				<DialogTitle>🛒 Create a New Sale</DialogTitle>
				<DialogContent>
					{selectedProducts.map((item, index) => (
						<Card key={index} style={{ marginBottom: 10 }}>
							<CardContent>
								<Autocomplete
									options={products}
									getOptionLabel={(option) =>
										option && option.product_name
											? `${option.product_name} - KES ${option.selling_price}`
											: ""
									}
									renderInput={(params) => (
										<TextField {...params} label='Select Product' fullWidth />
									)}
									onChange={(event, value) => handleProductChange(index, value)} // ✅ Pass entire product object
									noOptionsText='No products available'
								/>

								<TextField
									label='Quantity'
									type='number'
									fullWidth
									margin='dense'
									value={item.quantity}
									onChange={(e) =>
										handleQuantityChange(index, parseFloat(e.target.value))
									}
								/>
								<Typography variant='body1' style={{ marginTop: 5 }}>
									Selling Price: <b>KES {item.selling_price.toFixed(2)}</b>{" "}
									{/* ✅ Display selling price */}
								</Typography>

								<IconButton
									onClick={() =>
										setSelectedProducts(
											selectedProducts.filter((_, i) => i !== index)
										)
									}
									color='error'
								>
									<Delete />
								</IconButton>
							</CardContent>
						</Card>
					))}

					<Button
						startIcon={<Add />}
						onClick={handleAddProduct}
						color='primary'
					>
						Add Product
					</Button>
					<Typography variant='h6' style={{ marginTop: 10 }}>
						Total: <b>KES {totalPrice.toFixed(2)}</b>
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setOpen(false)}>Cancel</Button>
					<Button
						onClick={handleCreateSale}
						color='primary'
						variant='contained'
						disabled={selectedProducts.length === 0}
					>
						Process Sale
					</Button>
				</DialogActions>
			</Dialog>

			{receipt && (
				<div
					style={{
						position: "fixed",
						top: "20%",
						left: "40%",
						background: "#fff",
						padding: "20px",
						boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
					}}
				>
					<Receipt receipt={receipt} onClose={() => setReceipt(null)} />
				</div>
			)}
		</Container>
	);
};

export default Sales;
