/** @format */

const express = require("express");
const router = express.Router();
const sql = require("mssql");
const {
	authenticateUser,
	authorizeRole,
} = require("../middlewares/authMiddleware");

// Database Configuration
const dbConfig = {
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	server: process.env.DB_SERVER,
	database: process.env.DB_NAME,
	port: parseInt(process.env.DB_PORT) || 10019,
	options: {
		encrypt: false,
		trustServerCertificate: true,
	},
};

// Fetch Users (Admin Only)
router.get(
	"/users",
	authenticateUser,
	authorizeRole(["Admin"]),
	async (req, res) => {
		try {
			const pool = await sql.connect(dbConfig);
			const result = await pool
				.request()
				.query("SELECT id, username, role FROM Users");
			res.json(result.recordset);
		} catch (error) {
			console.error("Database Error:", error);
			res.status(500).json({ error: "Database error" });
		}
	}
);

// Delete user
router.delete(
	"/users/:id",
	authenticateUser,
	authorizeRole(["Admin"]),
	async (req, res) => {
		try {
			const { id } = req.params;
			const pool = await sql.connect(dbConfig);
			await pool
				.request()
				.input("id", sql.Int, id)
				.query("DELETE FROM Users WHERE id = @id");
			res.json({ message: "User deleted successfully" });
		} catch (error) {
			console.error("Error deleting user:", error);
			res.status(500).json({ error: "Database error" });
		}
	}
);

// Admin Dashboard Stats API
router.get(
	"/stats",
	authenticateUser,
	authorizeRole(["Admin"]),
	async (req, res) => {
		try {
			const pool = await sql.connect(dbConfig);

			// Fetch total users
			const usersResult = await pool
				.request()
				.query("SELECT COUNT(*) AS totalUsers FROM Users");
			const totalUsers = usersResult.recordset[0].totalUsers;

			// Fetch total sales
			const salesResult = await pool
				.request()
				.query("SELECT COUNT(*) AS totalSales FROM Sales");
			const totalSales = salesResult.recordset[0].totalSales;

			// Fetch total purchases
			const purchasesResult = await pool
				.request()
				.query("SELECT COUNT(*) AS totalPurchases FROM Purchases");
			const totalPurchases = purchasesResult.recordset[0].totalPurchases;

			// Fetch total products
			const productsResult = await pool
				.request()
				.query("SELECT COUNT(*) AS totalProducts FROM Products");
			const totalProducts = productsResult.recordset[0].totalProducts;

			// Fetch sales trend for the chart
			const salesTrendResult = await pool.request().query(`
            SELECT 
                FORMAT(CAST(SaleDate AS DATE), 'yyyy-MM') AS month, 
                COUNT(*) AS sales 
            FROM Sales 
            GROUP BY FORMAT(CAST(SaleDate AS DATE), 'yyyy-MM')
            ORDER BY month
        `);

			// Send response
			res.json({
				stats: {
					users: totalUsers,
					sales: totalSales,
					purchases: totalPurchases,
					products: totalProducts,
				},
				chartData: salesTrendResult.recordset,
			});
		} catch (error) {
			console.error("Error fetching admin dashboard data:", error);
			res.status(500).json({ error: "Internal Server Error" });
		}
	}
);

module.exports = router;

/** @format

const express = require("express");
const router = express.Router();
const sql = require("mssql");
const {
	authenticateUser,
	authorizeRole,
} = require("../middlewares/authMiddleware"); // ✅ Ensure this middleware is used correctly

// Database Configuration
const dbConfig = {
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	server: process.env.DB_SERVER,
	database: process.env.DB_NAME,
	port: parseInt(process.env.DB_PORT) || 1433,
	options: {
		encrypt: false,
		trustServerCertificate: true,
	},
};

// Fetch Users
router.get(
	"/users",
	authenticateUser,
	authorizeRole(["Admin"]),
	async (req, res) => {
		try {
			const pool = await sql.connect(dbConfig);
			const result = await pool
				.request()
				.query("SELECT id, username, role FROM Users");
			res.json(result.recordset);
		} catch (error) {
			console.error("Database Error:", error);
			res.status(500).json({ error: "Database error" });
		}
	}
);

// Delete user
router.delete("/users/:id", authenticateUser, async (req, res) => {
	try {
		const { id } = req.params;
		const pool = await sql.connect(process.env.DB_CONNECTION_STRING);
		await pool
			.request()
			.input("id", sql.Int, id)
			.query("DELETE FROM Users WHERE id = @id");
		res.json({ message: "User deleted successfully" });
	} catch (error) {
		res.status(500).json({ error: "Database error" });
	}
});

// Admin Dashboard Stats API
router.get("/stats", async (req, res) => {
	try {
		let pool = await sql.connect(dbConfig);

		// Fetch total users
		let usersResult = await pool
			.request()
			.query("SELECT COUNT(*) AS totalUsers FROM Users");
		let totalUsers = usersResult.recordset[0].totalUsers;

		// Fetch total sales
		let salesResult = await pool
			.request()
			.query("SELECT COUNT(*) AS totalSales FROM Sales");
		let totalSales = salesResult.recordset[0].totalSales;

		// Fetch total purchases
		let purchasesResult = await pool
			.request()
			.query("SELECT COUNT(*) AS totalPurchases FROM Purchases");
		let totalPurchases = purchasesResult.recordset[0].totalPurchases;

		// Fetch total products
		let productsResult = await pool
			.request()
			.query("SELECT COUNT(*) AS totalProducts FROM Products");
		let totalProducts = productsResult.recordset[0].totalProducts;

		// Fetch sales trend for the chart
		let salesTrendResult = await pool.request().query(`
            SELECT 
                FORMAT(SaleDate, 'yyyy-MM') AS month, 
                COUNT(*) AS sales 
            FROM Sales 
            GROUP BY FORMAT(SaleDate, 'yyyy-MM')
            ORDER BY month
        `);

		// Send response
		res.json({
			stats: {
				users: totalUsers,
				sales: totalSales,
				purchases: totalPurchases,
				products: totalProducts,
			},
			chartData: salesTrendResult.recordset,
		});
	} catch (error) {
		console.error("Error fetching admin dashboard data:", error);
		res.status(500).json({ error: "Internal Server Error" });
	}
});

module.exports = router;

 @format 

const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
	res.json({ message: "Welcome to the Admin Dashboard" });
});

module.exports = router;*/
