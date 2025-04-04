/** @format */

const express = require("express");
const router = express.Router();

router.get("/dashboard", async (req, res) => {
	try {
		const pool = await poolPromise;

		// Fetch total sales amount
		const salesResult = await pool.request().query(`
			SELECT SUM(total_price) AS total_sales FROM Sales
		`);
		const totalSales = salesResult.recordset[0]?.total_sales || 0;

		// Fetch total purchases amount
		const purchasesResult = await pool.request().query(`
			SELECT SUM(total) AS total_purchases FROM Purchases
		`);
		const totalPurchases = purchasesResult.recordset[0]?.total_purchases || 0;

		// Fetch total staff count
		const staffResult = await pool.request().query(`
			SELECT COUNT(*) AS total_staff FROM Users
		`);
		const totalStaff = staffResult.recordset[0]?.total_staff || 0;

		// Fetch active orders
		const ordersResult = await pool.request().query(`
			SELECT COUNT(*) AS active_orders FROM Orders WHERE status = 'active'
		`);
		const activeOrders = ordersResult.recordset[0]?.active_orders || 0;

		// Calculate profit/loss
		const profitLoss = totalSales - totalPurchases;

		// Fetch sales data for charts (group by month)
		const salesDataResult = await pool.request().query(`
			SELECT FORMAT(sale_date, 'MMM') AS month, SUM(total_price) AS sales
			FROM Sales
			GROUP BY FORMAT(sale_date, 'MMM')
		`);

		res.json({
			total_sales: totalSales,
			total_purchases: totalPurchases,
			profit_loss: profitLoss,
			total_staff: totalStaff,
			active_orders: activeOrders,
			salesData: salesDataResult.recordset,
		});
	} catch (error) {
		console.error("Error fetching dashboard data:", error);
		res.status(500).json({ error: "Server error" });
	}
});

module.exports = router;
