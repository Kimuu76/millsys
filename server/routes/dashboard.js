/** @format */
const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../models/db");
const { authenticateUser } = require("../middlewares/authMiddleware");

router.get("/", authenticateUser, async (req, res) => {
	try {
		const pool = await poolPromise;
		const companyId = req.user.company_id; // ✅ Get logged-in user's company ID

		if (!companyId) {
			return res.status(403).json({ error: "Unauthorized access." });
		}

		// Fetch total sales amount for the company
		const salesResult = await pool
			.request()
			.input("company_id", sql.Int, companyId)
			.query(
				`SELECT SUM(total_price) AS total_sales FROM Sales WHERE company_id = @company_id`
			);
		const totalSales = salesResult.recordset[0]?.total_sales || 0;

		// Fetch total purchases amount for the company
		const purchasesResult = await pool
			.request()
			.input("company_id", sql.Int, companyId)
			.query(
				`SELECT SUM(total) AS total_purchases FROM Purchases WHERE company_id = @company_id`
			);
		const totalPurchases = purchasesResult.recordset[0]?.total_purchases || 0;

		// Fetch total products count for the company
		const productsResult = await pool
			.request()
			.input("company_id", sql.Int, companyId)
			.query(
				`SELECT COUNT(*) AS total_products FROM Products WHERE company_id = @company_id`
			);
		const totalProducts = productsResult.recordset[0]?.total_products || 0;

		// Fetch total suppliers count for the company
		const suppliersResult = await pool
			.request()
			.input("company_id", sql.Int, companyId)
			.query(
				`SELECT COUNT(*) AS total_suppliers FROM Suppliers WHERE company_id = @company_id`
			);
		const totalSuppliers = suppliersResult.recordset[0]?.total_suppliers || 0;

		// Fetch total staff count for the company
		const staffResult = await pool
			.request()
			.input("company_id", sql.Int, companyId)
			.query(
				`SELECT COUNT(*) AS total_staff FROM Users WHERE company_id = @company_id`
			);
		const totalStaff = staffResult.recordset[0]?.total_staff || 0;

		// ✅ Fetch total expenses
		const expensesResult = await pool
			.request()
			.input("company_id", sql.Int, companyId)
			.query(
				"SELECT SUM(amount) AS total_expenses FROM Expenses WHERE company_id = @company_id"
			);
		const totalExpenses = expensesResult.recordset[0]?.total_expenses || 0;

		// ✅ Fetch recent expenses (limit to 5)
		const recentExpensesResult = await pool
			.request()
			.input("company_id", sql.Int, companyId)
			.query(
				"SELECT TOP 5 * FROM Expenses WHERE company_id = @company_id ORDER BY createdAt DESC"
			);

		const recentExpenses = recentExpensesResult.recordset;

		// Calculate profit/loss
		const profitLoss = totalSales - (totalPurchases + totalExpenses);

		// Fetch sales and purchases data for charts (group by month)
		const salesDataResult = await pool
			.request()
			.input("company_id", sql.Int, companyId).query(`
				SELECT FORMAT(sale_date, 'MMM') AS month, SUM(total_price) AS sales
				FROM Sales WHERE company_id = @company_id
				GROUP BY FORMAT(sale_date, 'MMM')
			`);

		const purchasesDataResult = await pool
			.request()
			.input("company_id", sql.Int, companyId).query(`
				SELECT FORMAT(createdAt, 'MMM') AS month, SUM(total) AS purchases
				FROM Purchases WHERE company_id = @company_id
				GROUP BY FORMAT(createdAt, 'MMM')
			`);

		// Merge sales and purchases data by month
		const salesData = salesDataResult.recordset;
		const purchasesData = purchasesDataResult.recordset;

		// Combine sales & purchases data for chart
		const chartData = salesData.map((sale) => {
			const purchase = purchasesData.find((p) => p.month === sale.month) || {
				purchases: 0,
			};
			return {
				month: sale.month,
				sales: sale.sales,
				purchases: purchase.purchases,
			};
		});

		res.json({
			total_sales: totalSales,
			total_purchases: totalPurchases,
			total_suppliers: totalSuppliers,
			profit_loss: profitLoss,
			total_staff: totalStaff,
			total_products: totalProducts,
			total_expenses: totalExpenses,
			salesData: chartData,
			recent_expenses: recentExpenses,
		});
	} catch (error) {
		console.error("Error fetching dashboard data:", error);
		res.status(500).json({ error: "Server error" });
	}
});

module.exports = router;
