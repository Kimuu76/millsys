/** @format */
const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../models/db");
const { authenticateUser } = require("../middlewares/authMiddleware");

router.get("/", authenticateUser, async (req, res) => {
	try {
		const pool = await poolPromise;
		const companyId = req.user.company_id;

		if (!companyId) {
			return res.status(403).json({ error: "Unauthorized access." });
		}

		// Define current week's Sunday (Day 1) to Saturday (Day 7)
		const result = await pool.request().input("company_id", sql.Int, companyId)
			.query(`
				DECLARE @Today DATE = CAST(GETDATE() AS DATE);
				DECLARE @WeekStart DATE = DATEADD(DAY, -DATEPART(WEEKDAY, @Today) + 1, @Today); -- Sunday
				DECLARE @WeekEnd DATE = DATEADD(DAY, 6, @WeekStart); -- Saturday

				-- Weekly Totals
				SELECT
					(SELECT SUM(total_price) FROM Sales WHERE company_id = @company_id AND sale_date BETWEEN @WeekStart AND @WeekEnd) AS total_sales,
					(SELECT SUM(total) FROM Purchases WHERE company_id = @company_id AND createdAt BETWEEN @WeekStart AND @WeekEnd) AS total_purchases,
					(SELECT SUM(amount) FROM Expenses WHERE company_id = @company_id AND createdAt BETWEEN @WeekStart AND @WeekEnd) AS total_expenses,
					(SELECT COUNT(*) FROM Products WHERE company_id = @company_id) AS total_products,
					(SELECT COUNT(*) FROM Suppliers WHERE company_id = @company_id) AS total_suppliers,
					(SELECT COUNT(*) FROM Users WHERE company_id = @company_id) AS total_staff,
					(SELECT SUM(quantity) FROM Stock WHERE company_id = @company_id) AS total_stock;

				-- Sales per day (Sunday–Saturday)
				SELECT DATENAME(WEEKDAY, sale_date) AS day, SUM(total_price) AS sales
				FROM Sales
				WHERE company_id = @company_id AND sale_date BETWEEN @WeekStart AND @WeekEnd
				GROUP BY DATENAME(WEEKDAY, sale_date);

				-- Purchases per day (Sunday–Saturday)
				SELECT DATENAME(WEEKDAY, createdAt) AS day, SUM(total) AS purchases
				FROM Purchases
				WHERE company_id = @company_id AND createdAt BETWEEN @WeekStart AND @WeekEnd
				GROUP BY DATENAME(WEEKDAY, createdAt);

				-- Expenses per day
SELECT DATENAME(WEEKDAY, createdAt) AS day, SUM(amount) AS expenses
FROM Expenses
WHERE company_id = @company_id AND createdAt BETWEEN @WeekStart AND @WeekEnd
GROUP BY DATENAME(WEEKDAY, createdAt);
                -- Monthly Sales
SELECT FORMAT(sale_date, 'MMM') AS month, SUM(total_price) AS sales
FROM Sales
WHERE company_id = @company_id
GROUP BY FORMAT(sale_date, 'MMM');

-- Monthly Purchases
SELECT FORMAT(createdAt, 'MMM') AS month, SUM(total) AS purchases
FROM Purchases
WHERE company_id = @company_id
GROUP BY FORMAT(createdAt, 'MMM');

-- Monthly Expenses
SELECT FORMAT(createdAt, 'MMM') AS month, SUM(amount) AS expenses
FROM Expenses
WHERE company_id = @company_id
GROUP BY FORMAT(createdAt, 'MMM');

			`);

		// Extract results
		const [
			aggregates,
			salesByDay,
			purchasesByDay,
			expensesByDay,
			salesByMonth,
			purchasesByMonth,
			expensesByMonth,
			recentExpenses,
		] = result.recordsets;

		// Normalize weekly days order
		const weekDays = [
			"Sunday",
			"Monday",
			"Tuesday",
			"Wednesday",
			"Thursday",
			"Friday",
			"Saturday",
		];

		// Monthly view
		const allMonths = [
			"Jan",
			"Feb",
			"Mar",
			"Apr",
			"May",
			"Jun",
			"Jul",
			"Aug",
			"Sep",
			"Oct",
			"Nov",
			"Dec",
		];
		const salesMonthMap = Object.fromEntries(
			salesByMonth.map((r) => [r.month, r.sales])
		);
		const purchasesMonthMap = Object.fromEntries(
			purchasesByMonth.map((r) => [r.month, r.purchases])
		);
		const expensesMonthMap = Object.fromEntries(
			expensesByMonth.map((r) => [r.month, r.expenses])
		);

		const salesMap = Object.fromEntries(
			salesByDay.map((row) => [row.day, row.sales])
		);
		const purchasesMap = Object.fromEntries(
			purchasesByDay.map((row) => [row.day, row.purchases])
		);
		const expensesMap = Object.fromEntries(
			expensesByDay.map((row) => [row.day, row.expenses])
		);

		const dailychartData = weekDays.map((day) => ({
			day,
			sales: salesMap[day] || 0,
			purchases: purchasesMap[day] || 0,
			expenses: expensesMap[day] || 0,
			profit:
				(salesMap[day] || 0) -
				((purchasesMap[day] || 0) + (expensesMap[day] || 0)),
		}));

		const monthlyChartData = allMonths.map((month) => ({
			month,
			sales: salesMonthMap[month] || 0,
			purchases: purchasesMonthMap[month] || 0,
			expenses: expensesMonthMap[month] || 0,
			profit:
				(salesMonthMap[month] || 0) -
				((purchasesMonthMap[month] || 0) + (expensesMonthMap[month] || 0)),
		}));

		const agg = aggregates[0];
		const profitLoss =
			(agg.total_sales || 0) -
			((agg.total_purchases || 0) + (agg.total_expenses || 0));

		res.json({
			total_sales: agg.total_sales || 0,
			total_purchases: agg.total_purchases || 0,
			total_expenses: agg.total_expenses || 0,
			total_products: agg.total_products || 0,
			total_suppliers: agg.total_suppliers || 0,
			total_staff: agg.total_staff || 0,
			total_stock: agg.total_stock || 0,
			profit_loss: profitLoss,
			recent_expenses: recentExpenses,

			// Corrected chart keys
			dailyChartData: dailychartData,
			monthlyChartData: monthlyChartData,
		});
	} catch (error) {
		console.error("Error fetching dashboard data:", error);
		res.status(500).json({ error: "Server error" });
	}
});

module.exports = router;

/** @format 
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

		// Fetch total stock count for the company
		const stockResult = await pool
			.request()
			.input("company_id", sql.Int, companyId)
			.query(
				`SELECT SUM(quantity) AS total_stock FROM Stock WHERE company_id = @company_id`
			);
		const totalStock = stockResult.recordset[0]?.total_stock || 0;

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
			total_stock: totalStock,
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

module.exports = router;*/
