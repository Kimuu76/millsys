/** @format */

const express = require("express");
const router = express.Router();
const db = require("../models/db");

// Cashier Dashboard API
router.get("/dashboard", async (req, res) => {
	try {
		const totalSalesResult = await db.query(
			"SELECT SUM(total_amount) AS total_sales FROM sales"
		);
		const totalSales = totalSalesResult.recordset[0].total_sales || 0;

		const pendingOrdersResult = await db.query(
			"SELECT COUNT(*) AS pending_orders FROM orders WHERE status = 'pending'"
		);
		const pendingOrders = pendingOrdersResult.recordset[0].pending_orders || 0;

		const completedOrdersResult = await db.query(
			"SELECT COUNT(*) AS completed_orders FROM orders WHERE status = 'completed'"
		);
		const completedOrders =
			completedOrdersResult.recordset[0].completed_orders || 0;

		const transactionsResult = await db.query(`
      SELECT id, customer, total_amount AS total, status, order_date AS date
      FROM orders ORDER BY order_date DESC LIMIT 10
    `);
		const transactions = transactionsResult.recordset;

		res.json({
			total_sales: totalSales,
			pending_orders: pendingOrders,
			completed_orders: completedOrders,
			recentTransactions: transactions,
		});
	} catch (error) {
		console.error("Error fetching cashier dashboard data:", error);
		res.status(500).json({ error: "Server error" });
	}
});

module.exports = router;
