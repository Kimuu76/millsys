/** @format */

const express = require("express");
const router = express.Router();
const db = require("../models/db");

// Manager Dashboard API
router.get("/dashboard", async (req, res) => {
	try {
		// Fetch total sales
		const totalSalesResult = await db.query(
			"SELECT SUM(total_amount) AS total_sales FROM sales"
		);
		const totalSales = totalSalesResult.recordset[0].total_sales || 0;

		// Fetch total staff
		const totalStaffResult = await db.query(
			"SELECT COUNT(*) AS total_staff FROM users WHERE role = 'staff'"
		);
		const totalStaff = totalStaffResult.recordset[0].total_staff || 0;

		// Fetch active orders
		const activeOrdersResult = await db.query(
			"SELECT COUNT(*) AS active_orders FROM orders WHERE status = 'pending'"
		);
		const activeOrders = activeOrdersResult.recordset[0].active_orders || 0;

		// Fetch sales and staff performance data for the chart
		const salesDataResult = await db.query(`
      SELECT FORMAT(sale_date, 'yyyy-MM') AS month, SUM(total_amount) AS sales
      FROM sales GROUP BY FORMAT(sale_date, 'yyyy-MM') ORDER BY month
    `);
		const salesData = salesDataResult.recordset;

		res.json({
			total_sales: totalSales,
			total_staff: totalStaff,
			active_orders: activeOrders,
			salesData: salesData,
		});
	} catch (error) {
		console.error("Error fetching manager dashboard data:", error);
		res.status(500).json({ error: "Server error" });
	}
});

module.exports = router;
