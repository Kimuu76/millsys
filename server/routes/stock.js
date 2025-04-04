/** @format */

const express = require("express");
const { sql, poolPromise } = require("../models/db");
const {
	authenticateUser,
	authorizeRole,
	verifyCompanyAccess,
} = require("../middlewares/authMiddleware");

const router = express.Router();

//post stock
router.post(
	"/",
	authenticateUser,
	authorizeRole(["Admin", "Manager"]),
	async (req, res) => {
		try {
			const { product_name, purchase_price, selling_price } = req.body;
			const { company_id } = req.user; // ✅ Get company ID from token

			if (!product_name || !purchase_price || !selling_price) {
				return res.status(400).json({ error: "All fields are required" });
			}

			const pool = await poolPromise;

			// Check if stock for the product already exists in the company
			const existingStock = await pool
				.request()
				.input("product_name", sql.NVarChar(255), product_name)
				.input("company_id", sql.Int, company_id)
				.query(
					"SELECT * FROM Stock WHERE product_name = @product_name AND company_id = @company_id"
				);

			if (existingStock.recordset.length > 0) {
				// If exists, update stock price
				await pool
					.request()
					.input("product_name", sql.NVarChar(255), product_name)
					.input("purchase_price", sql.Decimal(10, 2), purchase_price)
					.input("selling_price", sql.Decimal(10, 2), selling_price)
					.input("company_id", sql.Int, company_id).query(`
                    UPDATE Stock 
                    SET purchase_price = @purchase_price, selling_price = @selling_price 
                    WHERE product_name = @product_name AND company_id = @company_id
                `);

				return res.status(200).json({ message: "Stock updated successfully" });
			}

			// Insert new stock entry for the company
			await pool
				.request()
				.input("product_name", sql.NVarChar(255), product_name)
				.input("purchase_price", sql.Decimal(10, 2), purchase_price)
				.input("selling_price", sql.Decimal(10, 2), selling_price)
				.input("company_id", sql.Int, company_id).query(`
                INSERT INTO Stock (product_name, quantity, purchase_price, selling_price, company_id, added_at) 
                VALUES (@product_name, 0, @purchase_price, @selling_price, @company_id, GETDATE())
            `);

			res.status(201).json({ message: "Stock added successfully" });
		} catch (error) {
			console.error("❌ Error adding/updating stock:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	}
);

router.get("/", authenticateUser, async (req, res) => {
	try {
		const { company_id } = req.user;

		const pool = await poolPromise;
		const result = await pool
			.request()
			.input("company_id", sql.Int, company_id)
			.query(
				"SELECT * FROM Stock WHERE company_id = @company_id ORDER BY added_at DESC"
			);

		res.status(200).json(result.recordset);
	} catch (error) {
		console.error("❌ Error fetching stock:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

router.get("/:product_name/quantity", authenticateUser, async (req, res) => {
	try {
		const { product_name } = req.params;
		const { company_id } = req.user;

		const pool = await poolPromise;
		const result = await pool
			.request()
			.input("product_name", sql.NVarChar(255), product_name)
			.input("company_id", sql.Int, company_id)
			.query(
				"SELECT quantity FROM Stock WHERE product_name = @product_name AND company_id = @company_id"
			);

		if (result.recordset.length === 0) {
			return res.status(404).json({ message: "Product not found in stock" });
		}

		res.status(200).json(result.recordset[0]);
	} catch (error) {
		console.error("❌ Error fetching stock quantity:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

// ✅ Fetch products available for sale (From Stock Table)
router.get("/sales-products", authenticateUser, async (req, res) => {
	try {
		const { company_id } = req.user;

		const pool = await poolPromise;
		const result = await pool.request().input("company_id", sql.Int, company_id)
			.query(`
				SELECT 
					s.product_name, 
					s.selling_price, 
					s.quantity
				FROM Stock s
				WHERE s.company_id = @company_id
			`);

		console.log("✅ Fetched Sales Products:", result.recordset);
		res.status(200).json(result.recordset);
	} catch (error) {
		console.error("❌ Error fetching sales products:", error);
		res.status(500).json({ error: "Server error" });
	}
});

module.exports = router;
