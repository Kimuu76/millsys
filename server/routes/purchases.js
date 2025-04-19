/** @format */

const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../models/db");
const {
	authenticateUser,
	authorizeRole,
} = require("../middlewares/authMiddleware");

// ✅ Get all purchases (Restricted to the user's company)
/*router.get(
	"/",
	authenticateUser,
	authorizeRole(["Admin", "Manager"]),
	async (req, res) => {
		try {
			const pool = await poolPromise;
			const result = await pool
				.request()
				.input("company_id", sql.Int, req.user.company_id) // Restrict to the user's company
				.query(`
                SELECT p.id, p.product_name, p.quantity, p.purchase_price, p.total, p.createdAt, s.name AS supplier_name
                FROM Purchases p
                JOIN Suppliers s ON p.supplier_id = s.id
                WHERE p.company_id = @company_id
            `);
			res.json(result.recordset);
		} catch (error) {
			console.error("❌ Error fetching purchases:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	}
);*/
router.get(
	"/",
	authenticateUser,
	authorizeRole(["Admin", "Manager"]),
	async (req, res) => {
		try {
			const pool = await poolPromise;
			const result = await pool
				.request()
				.input("company_id", sql.Int, req.user.company_id).query(`
                SELECT p.id, p.product_name, p.quantity, p.purchase_price, 
                       p.total, p.createdAt, p.status, p.return_quantity, s.name AS supplier_name, s.contact AS supplier_contact, s.address AS supplier_address
                FROM Purchases p
                JOIN Suppliers s ON p.supplier_id = s.id
                WHERE p.company_id = @company_id
            `);
			res.json(result.recordset);
		} catch (error) {
			console.error("❌ Error fetching purchases:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	}
);

// ✅ Create a new purchase (Supports fractional quantities)
router.post(
	"/",
	authenticateUser,
	authorizeRole(["Admin", "Manager"]),
	async (req, res) => {
		try {
			const { product_name, supplier_id, quantity } = req.body;
			const { company_id } = req.user;

			if (!product_name || !supplier_id || !quantity || quantity <= 0) {
				return res
					.status(400)
					.json({ error: "Valid product, supplier, and quantity required" });
			}

			const pool = await poolPromise;

			// Fetch purchase price from stock
			const productResult = await pool
				.request()
				.input("company_id", sql.Int, req.user.company_id)
				.input("product_name", sql.NVarChar(255), product_name)
				.query(
					`SELECT purchase_price FROM Stock WHERE product_name = @product_name AND company_id = @company_id`
				);

			if (productResult.recordset.length === 0) {
				return res.status(404).json({ error: "Product not found in stock" });
			}

			const purchase_price = productResult.recordset[0].purchase_price;

			// ✅ Check if purchase price is set
			if (!purchase_price || purchase_price <= 0) {
				return res.status(400).json({
					error: `Purchase price for '${product_name}' is not set. Please update the stock price before purchasing.`,
				});
			}

			const total = purchase_price * quantity;

			// ✅ Insert purchase record
			await pool
				.request()
				.input("company_id", sql.Int, req.user.company_id)
				.input("product_name", sql.NVarChar(255), product_name)
				.input("supplier_id", sql.Int, supplier_id)
				.input("quantity", sql.Decimal(10, 2), quantity) // Support decimal quantity
				.input("purchase_price", sql.Decimal(10, 2), purchase_price)
				.input("total", sql.Decimal(10, 2), total).query(`
                INSERT INTO Purchases (product_name, supplier_id, quantity, purchase_price, total, company_id) 
                VALUES (@product_name, @supplier_id, @quantity, @purchase_price, @total, @company_id)
            `);

			// ✅ Update stock quantity
			await pool
				.request()
				.input("company_id", sql.Int, req.user.company_id)
				.input("product_name", sql.NVarChar(255), product_name)
				.input("quantity", sql.Decimal(10, 2), quantity).query(`
                UPDATE Stock 
                SET quantity = quantity + @quantity
                WHERE product_name = @product_name AND company_id = @company_id
            `);

			if (companyQuery.recordset.length === 0) {
				throw new Error("❌ Invalid company ID.");
			}

			const companyName = companyQuery.recordset[0].name;
			const companyAddress =
				companyQuery.recordset[0].address || "No Address Available";
			const companyPhone =
				companyQuery.recordset[0].phone || "No Phone Available!";

			res.status(201).json({
				message: "Purchase added and stock updated successfully!",
				quantity_purchased: quantity,
				company: {
					name: companyName,
					address: companyAddress,
					phone: companyPhone,
				},
			});
		} catch (error) {
			console.error("❌ Error creating purchase:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	}
);

router.post(
	"/import",
	authenticateUser,
	authorizeRole(["Admin", "Manager"]),
	async (req, res) => {
		try {
			const { data } = req.body;
			const company_id = req.user.company_id;

			if (!Array.isArray(data) || data.length === 0) {
				return res.status(400).json({ error: "Invalid import data" });
			}

			const pool = await poolPromise;
			const insertPromises = [];

			for (const row of data) {
				const { product_name, supplier_id, quantity } = row;

				if (!product_name || !supplier_id || !quantity) continue;

				const stockQuery = await pool
					.request()
					.input("company_id", sql.Int, company_id)
					.input("product_name", sql.NVarChar, product_name)
					.query(
						`SELECT purchase_price FROM Stock WHERE product_name = @product_name AND company_id = @company_id`
					);

				if (stockQuery.recordset.length === 0) continue;

				const purchase_price = stockQuery.recordset[0].purchase_price;
				const total = purchase_price * quantity;

				insertPromises.push(
					pool
						.request()
						.input("company_id", sql.Int, company_id)
						.input("product_name", sql.NVarChar, product_name)
						.input("supplier_id", sql.Int, supplier_id)
						.input("quantity", sql.Decimal(10, 2), quantity)
						.input("purchase_price", sql.Decimal(10, 2), purchase_price)
						.input("total", sql.Decimal(10, 2), total)
						.query(
							`INSERT INTO Purchases (product_name, supplier_id, quantity, purchase_price, total, company_id) 
							 VALUES (@product_name, @supplier_id, @quantity, @purchase_price, @total, @company_id)`
						)
				);

				// Update stock
				await pool
					.request()
					.input("company_id", sql.Int, company_id)
					.input("product_name", sql.NVarChar, product_name)
					.input("quantity", sql.Decimal(10, 2), quantity)
					.query(
						`UPDATE Stock SET quantity = quantity + @quantity 
						 WHERE product_name = @product_name AND company_id = @company_id`
					);
			}

			await Promise.all(insertPromises);

			res.json({ message: "✅ Purchases imported successfully." });
		} catch (error) {
			console.error("❌ Error importing purchases:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	}
);

// ✅ Delete a purchase & update stock (Admins & Managers)
router.delete(
	"/:id",
	authenticateUser,
	authorizeRole(["Admin"]),
	async (req, res) => {
		try {
			const { id } = req.params;
			const pool = await poolPromise;

			// ✅ Fetch purchase details before deletion (Ensure correct company)
			const purchaseResult = await pool
				.request()
				.input("company_id", sql.Int, req.user.company_id)
				.input("id", sql.Int, id)
				.query(
					"SELECT product_name, quantity FROM Purchases WHERE id = @id AND company_id = @company_id"
				);

			if (purchaseResult.recordset.length === 0) {
				return res.status(404).json({ error: "Purchase not found" });
			}

			const { product_name, quantity } = purchaseResult.recordset[0];

			// ✅ Delete purchase
			await pool
				.request()
				.input("company_id", sql.Int, req.user.company_id)
				.input("id", sql.Int, id)
				.query(
					"DELETE FROM Purchases WHERE id = @id AND company_id = @company_id"
				);

			// ✅ Reduce stock quantity (Ensure correct company)
			await pool
				.request()
				.input("company_id", sql.Int, req.user.company_id)
				.input("product_name", sql.NVarChar(255), product_name)
				.input("quantity", sql.Int, quantity).query(`
                UPDATE Stock 
                SET quantity = quantity - @quantity
                WHERE product_name = @product_name AND company_id = @company_id
            `);

			res.json({ message: "✅ Purchase deleted and stock updated." });
		} catch (error) {
			console.error("❌ Error deleting purchase:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	}
);

// ✅ Delete ALL purchases (Admin only)
router.delete(
	"/delete-all",
	authenticateUser,
	authorizeRole(["Admin"]),
	async (req, res) => {
		try {
			const pool = await poolPromise;

			// ✅ Fetch all purchases to reverse their quantities from stock
			const purchaseResult = await pool
				.request()
				.input("company_id", sql.Int, req.user.company_id).query(`
					SELECT product_name, quantity 
					FROM Purchases 
					WHERE company_id = @company_id
				`);

			// ✅ Update stock by subtracting each purchase quantity
			for (const { product_name, quantity } of purchaseResult.recordset) {
				await pool
					.request()
					.input("company_id", sql.Int, req.user.company_id)
					.input("product_name", sql.NVarChar(255), product_name)
					.input("quantity", sql.Decimal(10, 2), quantity).query(`
						UPDATE Stock
						SET quantity = quantity - @quantity
						WHERE product_name = @product_name AND company_id = @company_id
					`);
			}

			// ✅ Now delete all purchases for the company
			await pool.request().input("company_id", sql.Int, req.user.company_id)
				.query(`
					DELETE FROM Purchases 
					WHERE company_id = @company_id
				`);

			res.json({ message: "✅ All purchases deleted and stock updated." });
		} catch (error) {
			console.error("❌ Error deleting all purchases:", error);
			res
				.status(500)
				.json({ error: "Server error while deleting all purchases." });
		}
	}
);

// ✅ Admins can mark purchases as Paid
router.put(
	"/:id/pay",
	authenticateUser,
	authorizeRole(["Admin"]),
	async (req, res) => {
		try {
			const { id } = req.params;
			const pool = await poolPromise;

			// ✅ Check if the purchase exists and belongs to the admin's company
			const purchaseResult = await pool
				.request()
				.input("company_id", sql.Int, req.user.company_id)
				.input("id", sql.Int, id)
				.query(
					"SELECT id FROM Purchases WHERE id = @id AND company_id = @company_id"
				);

			if (purchaseResult.recordset.length === 0) {
				return res.status(404).json({ error: "Purchase not found" });
			}

			// ✅ Update the purchase status to 'Paid'
			await pool
				.request()
				.input("id", sql.Int, id)
				.input("company_id", sql.Int, req.user.company_id)
				.input("status", sql.NVarChar(20), "Paid")
				.query(
					"UPDATE Purchases SET status = @status WHERE id = @id AND company_id = @company_id"
				);

			res.json({ message: "✅ Purchase marked as Paid." });
		} catch (error) {
			console.error("❌ Error updating payment status:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	}
);

// ✅ Process a Purchase Return (Admins & Managers)
router.post(
	"/:id/return",
	authenticateUser,
	authorizeRole(["Admin", "Manager"]),
	async (req, res) => {
		try {
			const { id } = req.params;
			const { return_quantity } = req.body;
			const pool = await poolPromise;

			// Validate return quantity
			if (!return_quantity || return_quantity <= 0) {
				return res.status(400).json({ error: "Invalid return quantity." });
			}

			// ✅ Fetch purchase details
			const purchaseResult = await pool
				.request()
				.input("company_id", sql.Int, req.user.company_id)
				.input("id", sql.Int, id).query(`
					SELECT product_name, quantity, purchase_price, total, return_quantity 
					FROM Purchases 
					WHERE id = @id AND company_id = @company_id
				`);

			if (purchaseResult.recordset.length === 0) {
				return res.status(404).json({ error: "Purchase not found." });
			}

			const {
				product_name,
				quantity,
				purchase_price,
				total,
				return_quantity: existing_return_qty,
			} = purchaseResult.recordset[0];

			// ✅ Ensure return quantity is not more than purchased quantity
			if (return_quantity > quantity) {
				return res
					.status(400)
					.json({ error: "Return quantity exceeds purchased amount." });
			}

			// Calculate refund amount
			const refund_amount = return_quantity * purchase_price;
			const new_total = total - refund_amount;
			const updated_return_quantity =
				(existing_return_qty || 0) + return_quantity;

			// ✅ Update purchase record
			await pool
				.request()
				.input("id", sql.Int, id)
				.input("company_id", sql.Int, req.user.company_id)
				.input("return_quantity", sql.Decimal(10, 2), return_quantity)
				.input("new_total", sql.Decimal(10, 2), new_total)
				.input(
					"updated_return_quantity",
					sql.Decimal(10, 2),
					updated_return_quantity
				)
				.input("status", sql.NVarChar(20), "Returned").query(`
					UPDATE Purchases 
					SET quantity = quantity - @return_quantity, total = @new_total, return_quantity = @updated_return_quantity, status = @status 
					WHERE id = @id AND company_id = @company_id
				`);

			// ✅ Adjust stock (Reduce the stock since it's returned)
			await pool
				.request()
				.input("company_id", sql.Int, req.user.company_id)
				.input("product_name", sql.NVarChar(255), product_name)
				.input("return_quantity", sql.Decimal(10, 2), return_quantity).query(`
					UPDATE Stock 
					SET quantity = quantity - @return_quantity 
					WHERE product_name = @product_name AND company_id = @company_id
				`);

			res.json({
				message: "✅ Purchase returned successfully, stock and total updated.",
				return_quantity: updated_return_quantity,
				refund_amount: refund_amount,
				new_total: new_total,
			});
		} catch (error) {
			console.error("❌ Error processing return:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	}
);

module.exports = router;
