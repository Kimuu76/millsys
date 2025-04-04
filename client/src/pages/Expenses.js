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
import styled from "styled-components";
import API_BASE_URL from "../config";

const Container = styled.div`
	padding: 20px;
`;

const Expenses = () => {
	const [expenses, setExpenses] = useState([]);
	const [search, setSearch] = useState("");
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(true);
	const [newExpense, setNewExpense] = useState({
		category: "",
		amount: "",
		description: "",
	});

	// ✅ Fetch Expenses
	useEffect(() => {
		fetchExpenses();
	}, []);

	const fetchExpenses = async () => {
		try {
			const token = localStorage.getItem("token");
			const response = await fetch(`${API_BASE_URL}/api/expenses`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
			});

			const data = await response.json();
			setExpenses(data);
			setLoading(false);
		} catch (error) {
			console.error("❌ Error fetching expenses:", error);
			setExpenses([]);
		}
	};

	const handleAddExpense = async () => {
		if (!newExpense.category || !newExpense.amount) {
			return alert("Category and Amount are required!");
		}

		try {
			const token = localStorage.getItem("token");
			await fetch(`${API_BASE_URL}/api/expenses`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(newExpense),
			});

			fetchExpenses();
			setOpen(false);
			setNewExpense({ category: "", amount: "", description: "" });
		} catch (error) {
			console.error("❌ Error adding expense:", error);
		}
	};

	const handleDelete = async (id) => {
		if (!window.confirm("Are you sure you want to delete this expense?"))
			return;

		try {
			const token = localStorage.getItem("token");
			await fetch(`${API_BASE_URL}/api/expenses/${id}`, {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
			});
			fetchExpenses();
		} catch (error) {
			console.error("❌ Error deleting expense:", error);
		}
	};

	return (
		<Container>
			<h2>Expense Management</h2>
			<TextField
				label='Search Expenses'
				variant='outlined'
				fullWidth
				margin='normal'
				onChange={(e) => setSearch(e.target.value)}
			/>
			<Button variant='contained' color='primary' onClick={() => setOpen(true)}>
				Add Expense
			</Button>

			{loading ? (
				<CircularProgress style={{ marginTop: 20 }} />
			) : (
				<TableContainer
					component={Paper}
					style={{ maxHeight: "400px", overflowY: "auto" }}
				>
					<Table stickyHeader>
						<TableHead>
							<TableRow>
								<TableCell>Category</TableCell>
								<TableCell>Amount (KES)</TableCell>
								<TableCell>Date</TableCell>
								<TableCell>Actions</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{expenses.map((expense) => (
								<TableRow key={expense.id}>
									<TableCell>{expense.category}</TableCell>
									<TableCell>{expense.amount}</TableCell>
									{/*<TableCell>{expense.description}</TableCell>*/}
									<TableCell>
										{new Date(expense.createdAt).toLocaleString()}
									</TableCell>
									<TableCell>
										<Button
											color='error'
											onClick={() => handleDelete(expense.id)}
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

			{/* Add Expense Dialog */}
			<Dialog open={open} onClose={() => setOpen(false)}>
				<DialogTitle>Add New Expense</DialogTitle>
				<DialogContent>
					<TextField
						label='Category'
						fullWidth
						margin='dense'
						value={newExpense.category}
						onChange={(e) =>
							setNewExpense({ ...newExpense, category: e.target.value })
						}
					/>
					<TextField
						label='Amount'
						fullWidth
						margin='dense'
						type='number'
						value={newExpense.amount}
						onChange={(e) =>
							setNewExpense({ ...newExpense, amount: e.target.value })
						}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setOpen(false)}>Cancel</Button>
					<Button onClick={handleAddExpense} color='primary'>
						Add
					</Button>
				</DialogActions>
			</Dialog>
		</Container>
	);
};

export default Expenses;
