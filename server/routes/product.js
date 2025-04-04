/** @format */

const express = require("express");
const { sql, poolPromise } = require("../models/db");
const {
	authenticateUser,
	authorizeRole,
	verifyCompanyAccess,
} = require("../middlewares/authMiddleware");

const router = express.Router();

// 📌 Get Products for the Logged-in User's Company
router.get("/", authenticateUser, async (req, res) => {
	try {
		const { company_id } = req.user; // ✅ Get `company_id` from JWT

		const pool = await poolPromise;
		const result = await pool
			.request()
			.input("company_id", sql.Int, company_id)
			.query("SELECT * FROM Products WHERE company_id = @company_id"); // ✅ Fetch products for the specific company

		res.status(200).json(result.recordset);
	} catch (error) {
		console.error("❌ Error fetching products:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// 📌 Add a New Product (Ensuring Independent Products per Company)
router.post(
	"/",
	authenticateUser,
	authorizeRole(["Admin", "Manager"]),
	async (req, res) => {
		try {
			const { name } = req.body;
			const { company_id } = req.user;

			if (!name) {
				return res.status(400).json({ error: "Product name is required." });
			}

			const pool = await poolPromise;

			// ✅ Check if the product already exists **ONLY within the same company**
			const existingProduct = await pool
				.request()
				.input("name", sql.NVarChar, name)
				.input("company_id", sql.Int, company_id)
				.query(
					"SELECT * FROM Products WHERE name = @name AND company_id = @company_id"
				);

			if (existingProduct.recordset.length > 0) {
				return res
					.status(400)
					.json({ error: "This product already exists in your company." });
			}

			// ✅ Insert product (specific to the company)
			await pool
				.request()
				.input("name", sql.NVarChar, name)
				.input("company_id", sql.Int, company_id)
				.query(
					"INSERT INTO Products (name, company_id) VALUES (@name, @company_id)"
				);

			res.status(201).json({ message: "✅ Product added successfully!" });
		} catch (error) {
			// ✅ Catch unique constraint error & return a user-friendly message
			if (error.number === 2627) {
				return res
					.status(400)
					.json({ error: "⚠️ This product already exists in your company." });
			}
			console.error("❌ Error adding product:", error);
			res.status(500).json({ message: "Server error" });
		}
	}
);

// 📌 Update Product (Only for Logged-in User's Company)
router.put(
	"/:id",
	authenticateUser,
	authorizeRole(["Admin", "Manager"]),
	verifyCompanyAccess,
	async (req, res) => {
		try {
			const { id } = req.params;
			const { name } = req.body;
			const { company_id } = req.user;

			if (!name) {
				return res.status(400).json({ error: "Product name is required." });
			}

			const pool = await poolPromise;

			// ✅ Ensure the product exists for the specific company
			const result = await pool
				.request()
				.input("id", sql.Int, id)
				.input("company_id", sql.Int, company_id)
				.query(
					"SELECT * FROM Products WHERE id = @id AND company_id = @company_id"
				);

			if (result.recordset.length === 0) {
				return res.status(404).json({ error: "Product not found." });
			}

			// ✅ Update product name
			await pool
				.request()
				.input("id", sql.Int, id)
				.input("name", sql.NVarChar, name)
				.input("company_id", sql.Int, company_id)
				.query(
					"UPDATE Products SET name = @name WHERE id = @id AND company_id = @company_id"
				);

			res.json({ message: "✅ Product updated successfully!" });
		} catch (error) {
			console.error("❌ Error updating product:", error);
			res.status(500).json({ message: "Server error" });
		}
	}
);

// 📌 Delete Product (Only Admins from the Same Company)
router.delete(
	"/:id",
	authenticateUser,
	authorizeRole(["Admin"]),
	verifyCompanyAccess,
	async (req, res) => {
		try {
			const { id } = req.params;
			const { company_id } = req.user;

			const pool = await poolPromise;

			// ✅ Ensure product belongs to the logged-in user's company before deleting
			const result = await pool
				.request()
				.input("id", sql.Int, id)
				.input("company_id", sql.Int, company_id)
				.query(
					"SELECT * FROM Products WHERE id = @id AND company_id = @company_id"
				);

			if (result.recordset.length === 0) {
				return res.status(404).json({ error: "Product not found." });
			}

			// ✅ Delete the product
			await pool
				.request()
				.input("id", sql.Int, id)
				.query("DELETE FROM Products WHERE id = @id");

			res.json({ message: "✅ Product deleted successfully!" });
		} catch (error) {
			console.error("❌ Error deleting product:", error);
			res.status(500).json({ error: "Server error" });
		}
	}
);

module.exports = router;

/** @format 

const express = require("express");
const { sql, poolPromise } = require("../models/db");
const {
	authenticateUser,
	authorizeRole,
	verifyCompanyAccess,
} = require("../middlewares/authMiddleware");

const router = express.Router();

// 📌 Get All Products (Restricted to Logged-in User's Company)
router.get("/", authenticateUser, async (req, res) => {
	try {
		const { company_id } = req.user; // ✅ Get `company_id` from JWT

		const pool = await poolPromise;
		const result = await pool
			.request()
			.input("company_id", sql.Int, company_id)
			.query("SELECT * FROM Products WHERE company_id = @company_id");

		res.status(200).json(result.recordset);
	} catch (error) {
		console.error("❌ Error fetching products:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// 📌 Get a Single Product by ID (Restricted to Company)
router.get("/:id", authenticateUser, verifyCompanyAccess, async (req, res) => {
	try {
		const { id } = req.params;
		const { company_id } = req.user;

		const pool = await poolPromise;
		const result = await pool
			.request()
			.input("id", sql.Int, id)
			.input("company_id", sql.Int, company_id)
			.query(
				"SELECT * FROM Products WHERE id = @id AND company_id = @company_id"
			);

		if (result.recordset.length === 0) {
			return res.status(404).json({ message: "Product not found" });
		}

		res.status(200).json(result.recordset[0]);
	} catch (error) {
		console.error("❌ Error fetching product:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// 📌 Add a New Product (Only Admins & Managers)
router.post(
	"/",
	authenticateUser,
	authorizeRole(["Admin", "Manager"]),
	async (req, res) => {
		try {
			const { name } = req.body;
			const { company_id } = req.user;

			if (!name) {
				return res.status(400).json({ error: "Product name is required." });
			}

			const pool = await poolPromise;
			await pool
				.request()
				.input("name", sql.NVarChar, name)
				.input("company_id", sql.Int, company_id)
				.query(
					"INSERT INTO Products (name, company_id) VALUES (@name, @company_id)"
				);

			res.status(201).json({ message: "✅ Product added successfully!" });
		} catch (error) {
			console.error("❌ Error adding product:", error);
			res.status(500).json({ message: "Server error" });
		}
	}
);

// 📌 Update a Product (Only Admins & Managers)
router.put(
	"/:id",
	authenticateUser,
	authorizeRole(["Admin", "Manager"]),
	verifyCompanyAccess,
	async (req, res) => {
		try {
			const { id } = req.params;
			const { name } = req.body;
			const { company_id } = req.user;

			if (!name) {
				return res.status(400).json({ error: "Product name is required." });
			}

			const pool = await poolPromise;
			const result = await pool
				.request()
				.input("id", sql.Int, id)
				.input("company_id", sql.Int, company_id)
				.query(
					"SELECT * FROM Products WHERE id = @id AND company_id = @company_id"
				);

			if (result.recordset.length === 0) {
				return res.status(404).json({ error: "Product not found." });
			}

			await pool
				.request()
				.input("id", sql.Int, id)
				.input("name", sql.NVarChar, name)
				.input("company_id", sql.Int, company_id)
				.query(
					"UPDATE Products SET name = @name WHERE id = @id AND company_id = @company_id"
				);

			res.json({ message: "✅ Product updated successfully!" });
		} catch (error) {
			console.error("❌ Error updating product:", error);
			res.status(500).json({ message: "Server error" });
		}
	}
);

// 📌 Delete a Product (Only Admins)
router.delete(
	"/:id",
	authenticateUser,
	authorizeRole(["Admin"]),
	verifyCompanyAccess,
	async (req, res) => {
		try {
			const { id } = req.params;

			const pool = await poolPromise;

			// ✅ Delete product only if it belongs to the user’s company
			await pool
				.request()
				.input("id", sql.Int, id)
				.query("DELETE FROM Products WHERE id = @id");

			res.json({ message: "✅ Product deleted successfully!" });
		} catch (error) {
			console.error("❌ Error deleting product:", error);
			res.status(500).json({ error: "Server error" });
		}
	}
);

module.exports = router;*/
