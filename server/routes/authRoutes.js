/** @format */

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sql, poolPromise } = require("../models/db");
const {
	authenticateUser,
	authorizeRole,
} = require("../middlewares/authMiddleware");
require("dotenv").config();

const router = express.Router();

// 📌 Register a New User (Admin Only)
router.post(
	"/register",
	authenticateUser,
	authorizeRole(["Admin"]),
	async (req, res) => {
		try {
			const { username, password, role } = req.body;
			const { company_id } = req.user; // ✅ Get company_id from logged-in admin's token

			// ✅ Ensure all fields are provided
			if (!username || !password || !role) {
				return res.status(400).json({ error: "All fields are required." });
			}

			const hashedPassword = await bcrypt.hash(password, 10);

			const pool = await poolPromise;
			await pool
				.request()
				.input("username", sql.NVarChar, username)
				.input("password", sql.NVarChar, hashedPassword)
				.input("role", sql.NVarChar, role)
				.input("company_id", sql.Int, company_id) // ✅ Use company_id from token
				.query(`
                INSERT INTO Users (username, password, role, company_id)
                VALUES (@username, @password, @role, @company_id)
            `);

			res.status(201).json({ message: "✅ User registered successfully." });
		} catch (error) {
			console.error("❌ Error registering user:", error);
			res.status(500).json({ error: "Server error" });
		}
	}
);

// 📌 Login User or SuperAdmin
router.post("/login", async (req, res) => {
	try {
		const { username, password } = req.body;
		const pool = await poolPromise;

		// 🔹 Step 1: Check Users Table
		let result = await pool
			.request()
			.input("username", sql.NVarChar, username)
			.query(
				"SELECT id, username, password, role, company_id FROM Users WHERE username = @username"
			);

		// 🔹 Step 2: If not found, check SuperAdmins table
		let user = result.recordset[0];
		if (!user) {
			console.log("🔍 User not found in Users table, checking SuperAdmins...");
			result = await pool
				.request()
				.input("username", sql.NVarChar, username)
				.query(
					"SELECT id, username, password, 'SuperAdmin' AS role FROM SuperAdmins WHERE username = @username"
				);

			user = result.recordset[0];

			// **If found in SuperAdmins table, assign SuperAdmin role**
			if (user) {
				user.role = "SuperAdmin";
				user.company_id = null; // No company ID for SuperAdmins
			}

			if (!user) {
				console.log("❌ User not found in any table.");
				return res.status(401).json({
					error: "Invalid credentials! Contact Support for assistance",
				});
			}
		}

		// 🔑 Verify password
		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			console.log("❌ Incorrect password.");
			return res
				.status(401)
				.json({
					error: "Incorrect password! Please Contact Support for assistance",
				});
		}

		// 🔑 Generate JWT Token
		const token = jwt.sign(
			{
				id: user.id,
				username: user.username,
				role: user.role,
				company_id: user.company_id || null, // ✅ SuperAdmins won't have a company_id
			},
			process.env.JWT_SECRET,
			{ expiresIn: "1h" }
		);

		// ✅ Send response
		console.log("✅ Login successful for:", user.username);
		res.json({
			token,
			role: user.role,
			company_id: user.company_id || null,
		});
	} catch (error) {
		console.error("❌ Error logging in:", error);
		res.status(500).json({ error: "Server error" });
	}
});

module.exports = router;
