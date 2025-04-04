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
} from "@mui/material";
import styled from "styled-components";
import API_BASE_URL from "../config";

const Container = styled.div`
	padding: 20px;
`;

const Products = () => {
	const [products, setProducts] = useState([]);
	const [search, setSearch] = useState("");
	const [open, setOpen] = useState(false);
	const [editingProduct, setEditingProduct] = useState(null);
	const [newProduct, setNewProduct] = useState({ name: "" });
	const [error, setError] = useState("");

	// Fetch products from backend
	useEffect(() => {
		fetchProducts();
	}, []);

	const fetchProducts = async () => {
		const token = localStorage.getItem("token"); // ✅ Get token from storage

		if (!token) {
			console.error("⚠️ No token found. User must log in.");
			return;
		}

		try {
			const response = await fetch(`${API_BASE_URL}/api/products`, {
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
			console.log("✅ Products:", data);

			// ✅ Ensure state is updated with company-specific products
			setProducts(data);
		} catch (error) {
			console.error("❌ Error fetching products:", error.message);
		}
	};

	const handleCreateProduct = async () => {
		try {
			const token = localStorage.getItem("token"); // ✅ Get token from storage
			const company_id = localStorage.getItem("company_id"); // ✅ Get company ID

			if (!token || !company_id) {
				console.error("⚠️ Missing authentication details.");
				alert("Authentication error. Please log in again.");
				return;
			}

			const response = await fetch(`${API_BASE_URL}/api/products`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`, // ✅ Include token for authentication
				},
				body: JSON.stringify({ ...newProduct, company_id }), // ✅ Send company ID
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to add product");
			}

			alert("✅ Product added successfully!");
			setOpen(false);
			setNewProduct({ name: "" });
			fetchProducts(); // ✅ Refresh product list
		} catch (error) {
			console.error("❌ Error adding product:", error);
			alert(error.message);
		}
	};

	const handleUpdateProduct = async () => {
		try {
			const token = localStorage.getItem("token");
			if (!token) {
				alert("Authentication error. Please log in again.");
				return;
			}

			const response = await fetch(
				`${API_BASE_URL}/api/products/${editingProduct.id}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify(newProduct),
				}
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to update product");
			}

			alert("✅ Product updated successfully!");
			setOpen(false);
			setEditingProduct(null);
			setNewProduct({ name: "" });
			fetchProducts();
		} catch (error) {
			console.error("❌ Error updating product:", error);
			alert(error.message);
		}
	};

	const handleAddOrEditProduct = () => {
		if (editingProduct) {
			handleUpdateProduct();
		} else {
			handleCreateProduct();
		}
	};

	const handleEdit = (product) => {
		setEditingProduct(product);
		setNewProduct(product);
		setOpen(true);
	};

	const handleDelete = async (id) => {
		if (!window.confirm("⚠️ Are you sure you want to delete this product?"))
			return;

		try {
			const token = localStorage.getItem("token");
			if (!token) {
				alert("Authentication error. Please log in again.");
				return;
			}

			const response = await fetch(`${API_BASE_URL}/api/products/${id}`, {
				method: "DELETE",
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to delete product");
			}

			alert("✅ Product deleted successfully!");
			fetchProducts();
		} catch (error) {
			console.error("❌ Error deleting product:", error);
			alert(error.message);
		}
	};

	return (
		<Container>
			<h2>Product Management</h2>

			{/* Error message */}
			{error && <p style={{ color: "red" }}>{error}</p>}

			{/* Search Input */}

			<TextField
				label='Search Products'
				variant='outlined'
				fullWidth
				margin='normal'
				onChange={(e) => setSearch(e.target.value)}
			/>
			<Button
				variant='contained'
				color='primary'
				onClick={() => {
					setOpen(true);
					setEditingProduct(null);
					setNewProduct({ name: "" });
				}}
			>
				Add Product
			</Button>

			<TableContainer component={Paper} style={{ marginTop: 20 }}>
				<Table>
					<TableHead>
						<TableRow>
							<TableCell>ID</TableCell>
							<TableCell>Name</TableCell>
							<TableCell>Actions</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{products
							.filter((product) =>
								product.name?.toLowerCase().includes(search.toLowerCase())
							)
							.map((product) => (
								<TableRow key={product.id}>
									<TableCell>{product.id}</TableCell>
									<TableCell>{product.name}</TableCell>
									<TableCell>
										<Button color='primary' onClick={() => handleEdit(product)}>
											Edit
										</Button>
										<Button
											color='secondary'
											onClick={() => handleDelete(product.id)}
										>
											Delete
										</Button>
									</TableCell>
								</TableRow>
							))}
					</TableBody>
				</Table>
			</TableContainer>

			<Dialog open={open} onClose={() => setOpen(false)}>
				<DialogTitle>
					{editingProduct ? "Edit Product" : "Add New Product"}
				</DialogTitle>
				<DialogContent>
					<TextField
						label='Product Name'
						fullWidth
						margin='dense'
						value={newProduct.name}
						onChange={(e) => setNewProduct({ name: e.target.value })}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setOpen(false)}>Cancel</Button>
					<Button onClick={handleAddOrEditProduct} color='primary'>
						{editingProduct ? "Update" : "Add"}
					</Button>
				</DialogActions>
			</Dialog>
		</Container>
	);
};

export default Products;
