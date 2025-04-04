/** @format */

const express = require("express");
const { poolPromise, sql } = require("../models/db");
const {
	authenticateUser,
	authorizeRole,
} = require("../middlewares/authMiddleware");

const router = express.Router();

const bcrypt = require("bcryptjs");

router.post("/register", async (req, res) => {
	try {
		const {
			name,
			email,
			phone,
			address,
			owner_name,
			admin_username,
			admin_password,
		} = req.body;

		if (
			!name ||
			!email ||
			!phone ||
			!owner_name ||
			!admin_username ||
			!admin_password
		) {
			return res.status(400).json({ error: "All fields are required" });
		}

		const pool = await poolPromise;

		// ✅ Check if the company already exists
		const existingCompany = await pool
			.request()
			.input("email", sql.NVarChar(255), email)
			.query("SELECT id FROM Companies WHERE email = @email");

		if (existingCompany.recordset.length > 0) {
			return res.status(400).json({ error: "Company already registered" });
		}

		// ✅ Insert new company
		const result = await pool
			.request()
			.input("name", sql.NVarChar(255), name)
			.input("email", sql.NVarChar(255), email)
			.input("phone", sql.NVarChar(50), phone)
			.input("address", sql.NVarChar(255), address || "")
			.input("owner_name", sql.NVarChar(255), owner_name).query(`
                INSERT INTO Companies (name, email, phone, address, owner_name)
                OUTPUT INSERTED.id
                VALUES (@name, @email, @phone, @address, @owner_name)
            `);

		const companyId = result.recordset[0].id;

		// ✅ Hash the admin password
		const hashedPassword = await bcrypt.hash(admin_password, 10);

		// ✅ Insert Admin User
		await pool
			.request()
			.input("username", sql.NVarChar(50), admin_username)
			.input("password", sql.NVarChar(255), hashedPassword)
			.input("role", sql.NVarChar(50), "Admin")
			.input("company_id", sql.Int, companyId).query(`
                INSERT INTO Users (username, password, role, company_id) 
                VALUES (@username, @password, @role, @company_id)
            `);

		res.status(201).json({
			message: "Company registered successfully with admin user",
			company_id: companyId,
		});
	} catch (error) {
		console.error("Error registering company:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

// ✅ Fetch company details from DB
router.get("/details", authenticateUser, async (req, res) => {
	try {
		if (!req.user || !req.user.company_id) {
			return res
				.status(403)
				.json({ error: "Unauthorized access. No company ID found." });
		}

		const companyId = req.user.company_id;
		const pool = await poolPromise;

		// ✅ Fetch company details (name, address, contact)
		const result = await pool
			.request()
			.input("company_id", sql.Int, companyId)
			.query(
				"SELECT name, address, phone FROM Companies WHERE id = @company_id"
			);

		if (!result.recordset.length) {
			return res.status(404).json({ error: "Company not found" });
		}

		res.json(result.recordset[0]); // ✅ Return company details
	} catch (error) {
		console.error("❌ Error fetching company details:", error);
		res.status(500).json({ error: "Server error" });
	}
});

// ✅ Change Admin Password (NEW)
router.put("/change-password", authenticateUser, async (req, res) => {
	try {
		const { currentPassword, newPassword } = req.body;
		const { id } = req.user; // Admin's ID from JWT token

		const pool = await poolPromise;

		// ✅ Fetch Admin's current password
		const result = await pool
			.request()
			.input("id", sql.Int, id)
			.query("SELECT password FROM Users WHERE id = @id");

		if (result.recordset.length === 0) {
			return res.status(404).json({ error: "Admin not found" });
		}

		const admin = result.recordset[0];

		// ✅ Verify current password
		const isMatch = await bcrypt.compare(currentPassword, admin.password);
		if (!isMatch) {
			return res.status(401).json({ error: "Incorrect current password" });
		}

		// ✅ Hash new password
		const hashedPassword = await bcrypt.hash(newPassword, 10);

		// ✅ Update password in the database
		await pool
			.request()
			.input("id", sql.Int, id)
			.input("password", sql.NVarChar, hashedPassword)
			.query("UPDATE Users SET password = @password WHERE id = @id");

		res.json({ message: "✅ Password updated successfully!" });
	} catch (error) {
		console.error("❌ Error changing password:", error);
		res.status(500).json({ error: "Server error" });
	}
});

router.put(
	"/reset-password/:id",
	authenticateUser,
	authorizeRole(["SuperAdmin"]),
	async (req, res) => {
		try {
			const { id } = req.params;
			console.log(`🔍 Attempting to reset password for Admin ID: ${id}`);

			const defaultPassword = "SYS.123";
			const hashedPassword = await bcrypt.hash(defaultPassword, 10);
			console.log("✅ Password successfully hashed.");

			const pool = await poolPromise;

			// ✅ Check if Admin exists
			const userResult = await pool
				.request()
				.input("id", sql.Int, id)
				.query("SELECT id FROM Users WHERE id = @id AND role = 'Admin'");

			if (userResult.recordset.length === 0) {
				console.log("❌ Admin not found.");
				return res.status(404).json({ error: "Admin not found" });
			}

			console.log("✅ Admin found, updating password...");

			// ✅ Reset password
			await pool
				.request()
				.input("id", sql.Int, id)
				.input("password", sql.NVarChar, hashedPassword)
				.query("UPDATE Users SET password = @password WHERE id = @id");

			console.log("✅ Password reset successful.");
			res.json({
				message: "✅ Password reset successfully! New password: 'SYS.123'",
			});
		} catch (error) {
			console.error("❌ Error resetting password:", error);
			res.status(500).json({ error: "Server error" });
		}
	}
);

module.exports = router;
