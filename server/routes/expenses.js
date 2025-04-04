/** @format */

const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../models/db");
const {
	authenticateUser,
	authorizeRole,
} = require("../middlewares/authMiddleware");

// ✅ Get All Expenses (Admins Only)
router.get(
	"/",
	authenticateUser,
	authorizeRole(["Admin"]),
	async (req, res) => {
		try {
			const pool = await poolPromise;
			const result = await pool
				.request()
				.input("company_id", sql.Int, req.user.company_id)
				.query(
					"SELECT * FROM Expenses WHERE company_id = @company_id ORDER BY createdAt DESC"
				);

			res.json(result.recordset);
		} catch (error) {
			console.error("❌ Error fetching expenses:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	}
);

// ✅ Add New Expense
router.post(
	"/",
	authenticateUser,
	authorizeRole(["Admin"]),
	async (req, res) => {
		try {
			const { category, amount, description } = req.body;
			if (!category || !amount) {
				return res
					.status(400)
					.json({ error: "Category and amount are required." });
			}

			const pool = await poolPromise;
			await pool
				.request()
				.input("company_id", sql.Int, req.user.company_id)
				.input("category", sql.NVarChar(255), category)
				.input("amount", sql.Decimal(10, 2), amount)
				.input("description", sql.NVarChar(500), description || "")
				.query(
					"INSERT INTO Expenses (category, amount, description, company_id) VALUES (@category, @amount, @description, @company_id)"
				);

			res.status(201).json({ message: "✅ Expense added successfully!" });
		} catch (error) {
			console.error("❌ Error adding expense:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	}
);

// ✅ Delete Expense
router.delete(
	"/:id",
	authenticateUser,
	authorizeRole(["Admin"]),
	async (req, res) => {
		try {
			const { id } = req.params;
			const pool = await poolPromise;

			await pool
				.request()
				.input("id", sql.Int, id)
				.input("company_id", sql.Int, req.user.company_id)
				.query(
					"DELETE FROM Expenses WHERE id = @id AND company_id = @company_id"
				);

			res.json({ message: "✅ Expense deleted successfully!" });
		} catch (error) {
			console.error("❌ Error deleting expense:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	}
);

module.exports = router;
