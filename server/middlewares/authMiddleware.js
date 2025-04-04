/** @format */

const jwt = require("jsonwebtoken");
const { sql, poolPromise } = require("../models/db");
require("dotenv").config();

const authenticateUser = (req, res, next) => {
	try {
		const authHeader = req.header("Authorization");

		// ✅ Log the incoming headers
		console.log("🔍 Request Headers:", req.headers);

		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			console.warn("⚠️ No token provided.");
			return res
				.status(401)
				.json({ error: "Access denied. No token provided." });
		}

		const token = authHeader.split(" ")[1];
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		req.user = decoded;

		// ✅ Ensure `company_id` exists in the token
		if (!req.user.company_id && decoded.role !== "SuperAdmin") {
			console.error("❌ Missing company_id in token!");
			return res.status(403).json({ error: "Invalid company credentials." });
		}

		next();
	} catch (err) {
		console.error("❌ JWT Verification Failed:", err.message);
		return res
			.status(401)
			.json({ error: "Session expired. Please log in again." });
	}
};

// Middleware to check for specific roles
const authorizeRole = (roles) => {
	return (req, res, next) => {
		if (!req.user || !roles.includes(req.user.role)) {
			return res
				.status(403)
				.json({ error: "Forbidden. You don't have access." });
		}
		next();
	};
};

// **Middleware to ensure users can only access their company data**
const verifyCompanyAccess = async (req, res, next) => {
	try {
		const { company_id } = req.user;
		let { id } = req.params;

		// ✅ Skip verification for `/sales-products`
		if (!id) {
			console.log("✅ Skipping verifyCompanyAccess for", req.originalUrl);
			return next();
		}

		// ✅ Ensure `id` is a number
		if (isNaN(Number(id))) {
			console.error(`❌ Invalid ID: ${id}`);
			return res.status(400).json({ error: "Invalid product ID." });
		}

		id = Number(id); // Convert to integer

		const pool = await poolPromise;

		// ✅ Check if product exists and get its company_id
		const result = await pool
			.request()
			.input("id", sql.Int, id)
			.query("SELECT company_id FROM Products WHERE id = @id");

		if (result.recordset.length === 0) {
			return res.status(404).json({ error: "Product not found." });
		}

		const productCompanyId = result.recordset[0].company_id;

		// ✅ Check if user is in the same company
		if (productCompanyId !== company_id) {
			return res.status(403).json({ error: "Unauthorized company access." });
		}

		next();
	} catch (error) {
		console.error("❌ Error in verifyCompanyAccess:", error);
		res.status(500).json({ error: "Server error" });
	}
};

/** ✅ Authenticate Super Admin */
const authenticateSuperAdmin = async (req, res, next) => {
	const token = req.header("Authorization")?.split(" ")[1]; // 🔥 Extract Bearer token

	if (!token) {
		return res.status(401).json({ error: "Access denied. No token provided." });
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		if (decoded.role !== "SuperAdmin") {
			return res.status(403).json({ error: "Forbidden. Not a Super Admin." });
		}

		req.superadmin = decoded; // ✅ Attach decoded SuperAdmin data to request
		next();
	} catch (error) {
		console.error("❌ Token verification failed:", error);
		res.status(401).json({ error: "Invalid token." });
	}
};

module.exports = {
	authenticateUser,
	authorizeRole,
	verifyCompanyAccess,
	authenticateSuperAdmin,
};
