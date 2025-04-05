/** @format */

const express = require("express");
const router = express.Router();
const {
	authenticateUser,
	authorizeRole,
	verifyCompanyAccess,
} = require("../middlewares/authMiddleware");
const { sql, poolPromise } = require("../models/db");

// 📌 Create sale (With Company Name in Receipt)
router.post(
	"/sale",
	authenticateUser,
	authorizeRole(["Cashier", "Admin", "Manager"]),
	async (req, res) => {
		try {
			const { products } = req.body;
			const { company_id } = req.user;

			console.log(
				"🛒 Received sale request:",
				JSON.stringify(req.body, null, 2)
			);

			if (!products || products.length === 0) {
				return res
					.status(400)
					.json({ error: "At least one product is required" });
			}

			const pool = await poolPromise;
			const transaction = new sql.Transaction(pool);

			try {
				await transaction.begin();

				// ✅ Fetch Company Name
				const companyQuery = await transaction
					.request()
					.input("company_id", sql.Int, company_id)
					.query(
						"SELECT name, address, phone FROM Companies WHERE id = @company_id"
					);

				if (companyQuery.recordset.length === 0) {
					throw new Error("❌ Invalid company ID.");
				}

				const companyName = companyQuery.recordset[0].name;
				const companyAddress =
					companyQuery.recordset[0].address || "No Address Available";
				const companyPhone =
					companyQuery.recordset[0].phone || "No Phone Available!";

				// ✅ Generate Receipt Header
				const receiptId = `REC-${Math.floor(100000 + Math.random() * 900000)}`;
				let receipt = "";
				receipt += `Receipt ID: ${receiptId}\nDate: ${new Date().toLocaleString()}\n--------------------------------\n`;

				let computedTotal = 0;

				for (const item of products) {
					const { product_name, quantity } = item;

					if (!product_name || !quantity || isNaN(quantity) || quantity <= 0) {
						throw new Error(
							`❌ Invalid product or quantity: ${JSON.stringify(item)}`
						);
					}

					// ✅ Fetch product details
					const productQuery = await transaction
						.request()
						.input("product_name", sql.NVarChar(255), product_name)
						.query(
							"SELECT selling_price, quantity FROM Stock WHERE product_name = @product_name"
						);

					if (productQuery.recordset.length === 0) {
						throw new Error(`❌ Product '${product_name}' not found in stock`);
					}

					const product = productQuery.recordset[0];
					const sellingPrice = parseFloat(product.selling_price);
					const itemTotalPrice = sellingPrice * quantity;
					computedTotal += itemTotalPrice;

					// ✅ Insert sale record
					await transaction
						.request()
						.input("product_name", sql.NVarChar(255), product_name)
						.input("quantity", sql.Int, quantity)
						.input("total_price", sql.Decimal(10, 2), itemTotalPrice)
						.input("company_id", sql.Int, company_id)
						.query(
							"INSERT INTO Sales (product_name, quantity, total_price, company_id) VALUES (@product_name, @quantity, @total_price, @company_id)"
						);

					// ✅ Reduce stock
					await transaction
						.request()
						.input("product_name", sql.NVarChar(255), product_name)
						.input("quantity", sql.Int, quantity)
						.query(
							"UPDATE Stock SET quantity = quantity - @quantity WHERE product_name = @product_name"
						);

					// ✅ Add product to receipt
					receipt += `${product_name} x ${quantity} = KES ${itemTotalPrice.toFixed(
						2
					)}\n`;
				}

				await transaction.commit();

				receipt += `--------------------------------\nTOTAL: KES ${computedTotal.toFixed(
					2
				)}\n================================\n`;

				console.log("✅ Sale processed successfully:", {
					computedTotal,
					receipt,
				});
				res.status(200).json({
					message: "✅ Sale completed successfully",
					receipt: Buffer.from(receipt, "utf-8").toString("utf-8"),
					company: {
						name: companyName,
						address: companyAddress,
						phone: companyPhone,
					},
				});
			} catch (error) {
				await transaction.rollback();
				console.error("❌ Transaction error:", error);
				res.status(400).json({ error: error.message });
			}
		} catch (error) {
			console.error("❌ Error processing sale:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	}
);

// 📌 Get all sales (Filtered by Company)
router.get("/", authenticateUser, async (req, res) => {
	try {
		const { company_id } = req.user; // ✅ Get company from token

		const pool = await poolPromise;
		const result = await pool.request().input("company_id", sql.Int, company_id)
			.query(`
				SELECT s.id, s.product_name, s.quantity, s.total_price, s.sale_date, c.name AS company_name
				FROM Sales s
				JOIN Companies c ON s.company_id = c.id
				WHERE s.company_id = @company_id
			`);

		console.log("✅ Fetched sales for company:", company_id);
		res.json(result.recordset);
	} catch (error) {
		console.error("❌ Error fetching sales:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

// 📌 Delete a Sale (Company Restricted)
router.delete(
	"/:id",
	authenticateUser,
	authorizeRole(["Admin"]),
	async (req, res) => {
		try {
			const { id } = req.params;
			const { company_id } = req.user; // ✅ Get company from token

			const pool = await poolPromise;

			// ✅ Check if sale belongs to the company
			const saleQuery = await pool
				.request()
				.input("id", sql.Int, id)
				.query(
					"SELECT product_name, quantity, company_id FROM Sales WHERE id = @id"
				);

			if (saleQuery.recordset.length === 0) {
				return res.status(404).json({ error: "Sale not found." });
			}

			const saleCompanyId = saleQuery.recordset[0].company_id;

			// ✅ Ensure user is deleting only from their company
			if (saleCompanyId !== company_id) {
				return res.status(403).json({ error: "Unauthorized company access." });
			}

			// ✅ Restore stock
			const { product_name, quantity } = saleQuery.recordset[0];
			await pool
				.request()
				.input("product_name", sql.NVarChar(255), product_name)
				.input("quantity", sql.Int, quantity)
				.query(
					"UPDATE Stock SET quantity = quantity + @quantity WHERE product_name = @product_name"
				);

			// ✅ Delete sale
			await pool
				.request()
				.input("id", sql.Int, id)
				.query("DELETE FROM Sales WHERE id = @id");

			res.json({ message: "✅ Sale deleted and stock restored successfully!" });
		} catch (error) {
			console.error("❌ Error deleting sale:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	}
);

module.exports = router;
