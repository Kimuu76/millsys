/** @format */

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const sql = require("mssql");
require("dotenv").config();
require("./jobs/sendDailySMS");
//console.log("DB Config:", process.env.DB_PORT);
const { createSuperAdminTable } = require("./models/superadmin");
const { createUserTable } = require("./models/user");
const { createProductTable } = require("./models/Product");
const { createSalesTable } = require("./models/sales");
const { createPurchasesTable } = require("./models/purchase");

const { createStockTable } = require("./models/stock");
const { createSuppliersTable } = require("./models/supplier");
const { createPendingDeletionsTable } = require("./models/pendingDeletions");
const { createCompanyTable } = require("./models/company");
const {
	createSystemLogsTable,
	insertSystemLog,
} = require("./models/systemLogs");
const { createExpensesTable } = require("./models/expenses");
const { setupWeeklyDeliveries } = require("./models/setupWeeklyDeliveries");
const {
	authenticateUser,
	authorizeRole,
} = require("./middlewares/authMiddleware");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const managerRoutes = require("./routes/managerRoutes");
const cashierRoutes = require("./routes/cashierRoutes");
const userRoutes = require("./routes/user");
const productRoutes = require("./routes/product");
const salesRoutes = require("./routes/sales");
const purchasesRoutes = require("./routes/purchases");
const dashboardRoutes = require("./routes/dashboard");
const stockRoutes = require("./routes/stock");
const supplierRoutes = require("./routes/suppliers");
const pendingDeletionsRoutes = require("./routes/deleteRequests");
const { router: reportsRoutes } = require("./routes/reports");
const companyRoutes = require("./routes/company");
const superAdminRoutes = require("./routes/superadmin");
const expensesRoutes = require("./routes/expenses");

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Initialize database tables
(async () => {
	await createSuperAdminTable();
	await createCompanyTable();
	await createUserTable();
	await createSuppliersTable();
	await createStockTable();
	await createPurchasesTable();

	await createSalesTable();
	await createProductTable();
	await createPendingDeletionsTable();
	await createSystemLogsTable();
	await createExpensesTable();
	await setupWeeklyDeliveries();
})();

app.post("/api/log-action", authenticateUser, async (req, res) => {
	try {
		const { action } = req.body;
		await insertSystemLog(action, req.user.username);
		res.json({ message: "Action logged successfully" });
	} catch (error) {
		console.error("❌ Error logging action:", error);
		res.status(500).json({ error: "Server error" });
	}
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", authenticateUser, authorizeRole(["Admin"]), adminRoutes);
app.use(
	"/api/manager",
	authenticateUser,
	authorizeRole(["Admin", "Manager"]),
	managerRoutes
);
app.use(
	"/api/cashier",
	authenticateUser,
	authorizeRole(["Admin", "Manager", "Cashier"]),
	cashierRoutes
);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/purchases", purchasesRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/deletions", pendingDeletionsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/expenses", expensesRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.get("/", (req, res) => {
	res.send("✅ Backend is running successfully!");
});
