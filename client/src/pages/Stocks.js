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
	Select,
	FormControl,
	InputLabel,
} from "@mui/material";
import styled from "styled-components";
import API_BASE_URL from "../config";

const Container = styled.div`
	padding: 20px;
`;

const Stock = () => {
	const [products, setProducts] = useState([]); // Available product names
	const [stock, setStock] = useState([]); // Stock data
	const [selectedProduct, setSelectedProduct] = useState(""); // Selected product name
	const [purchasePrice, setPurchasePrice] = useState(""); // Purchase price
	const [sellingPrice, setSellingPrice] = useState(""); // Selling price
	const [open, setOpen] = useState(false); // Dialog open state
	const [loading, setLoading] = useState(true);

	// ✅ Fetch products on component mount
	useEffect(() => {
		fetchProducts();
		fetchStock();
	}, []);

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

	const fetchStock = async () => {
		try {
			const token = localStorage.getItem("token");

			if (!token) {
				console.error("⚠️ No token found. User must log in.");
				return;
			}

			const response = await fetch(`${API_BASE_URL}/api/stock`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`, // ✅ Include authentication token
				},
			});

			if (!response.ok) {
				throw new Error(`Server responded with ${response.status}`);
			}

			const data = await response.json();
			setStock(data);
		} catch (error) {
			console.error("❌ Error fetching stock:", error);
			setStock([]); // Handle errors by setting an empty array
		}
	};

	const handleAddStock = async () => {
		try {
			const token = localStorage.getItem("token");

			if (!token) {
				console.error("⚠️ No token found. User must log in.");
				return;
			}

			const response = await fetch(`${API_BASE_URL}/api/stock`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`, // ✅ Include authentication token
				},
				body: JSON.stringify({
					product_name: selectedProduct,
					purchase_price: purchasePrice,
					selling_price: sellingPrice,
				}),
			});

			if (!response.ok) throw new Error("Failed to add stock");

			alert("Stock prices set successfully!");
			setOpen(false);
			setSelectedProduct("");
			setPurchasePrice("");
			setSellingPrice("");
			fetchStock();
		} catch (error) {
			console.error("❌ Error adding stock:", error);
			alert("Error adding stock");
		}
	};

	return (
		<Container>
			<h2>Stock & Prices Management</h2>
			<Button variant='contained' color='primary' onClick={() => setOpen(true)}>
				Set Stock Prices
			</Button>

			<TableContainer
				component={Paper}
				style={{ maxHeight: "400px", overflowY: "auto" }}
			>
				<Table stickyHeader>
					<TableHead>
						<TableRow>
							<TableCell>Product Name</TableCell>
							<TableCell>Purchase Price</TableCell>
							<TableCell>Selling Price</TableCell>
							<TableCell>Stock Quantity</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{stock.map((item) => (
							<TableRow key={item.id}>
								<TableCell>{item.product_name}</TableCell>
								<TableCell>KES {item.purchase_price}</TableCell>
								<TableCell>KES {item.selling_price}</TableCell>
								<TableCell>{item.quantity ?? "N/A"}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>

			{/* Add Stock Dialog */}
			<Dialog open={open} onClose={() => setOpen(false)}>
				<DialogTitle>Set Purchase & Selling Price</DialogTitle>
				<DialogContent>
					<FormControl fullWidth margin='dense'>
						<InputLabel>Select Product</InputLabel>
						<Select
							value={selectedProduct}
							onChange={(e) => setSelectedProduct(e.target.value)}
						>
							{products.map((product) => (
								<MenuItem key={product.id} value={product.name}>
									{product.name}
								</MenuItem>
							))}
						</Select>
					</FormControl>

					<TextField
						label='Purchase Price'
						fullWidth
						margin='dense'
						type='number'
						value={purchasePrice}
						onChange={(e) => setPurchasePrice(e.target.value)}
					/>
					<TextField
						label='Selling Price'
						fullWidth
						margin='dense'
						type='number'
						value={sellingPrice}
						onChange={(e) => setSellingPrice(e.target.value)}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setOpen(false)}>Cancel</Button>
					<Button onClick={handleAddStock} color='primary'>
						Save
					</Button>
				</DialogActions>
			</Dialog>
		</Container>
	);
};

export default Stock;
