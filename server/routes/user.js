/** @format */

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sql, poolPromise } = require("../models/db");
const {
	authenticateUser,
	verifyCompanyAccess,
	authorizeRole,
} = require("../middlewares/authMiddleware");

const router = express.Router();
const SECRET_KEY = "secretkey"; // Replace with an env variable in production

// ✅ Database Configuration
const dbConfig = {
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	server: process.env.DB_SERVER,
	database: process.env.DB_NAME,
	port: parseInt(process.env.DB_PORT) || 10131,
	options: {
		encrypt: false,
		trustServerCertificate: true,
	},
};

// 📌 Get Users (Restricted to Company)
router.get("/", authenticateUser, async (req, res) => {
	try {
		const { company_id } = req.user; // ✅ Get `company_id` from JWT token

		// ✅ Debugging: Check received `company_id`
		console.log("Fetching users for company_id:", company_id);

		const pool = await poolPromise;
		const result = await pool
			.request()
			.input("company_id", sql.Int, company_id)
			.query(
				"SELECT id, username, role FROM Users WHERE company_id = @company_id"
			);

		// ✅ Debugging: Check returned users
		console.log("Users found:", result.recordset);

		res.json(result.recordset);
	} catch (error) {
		console.error("❌ Error fetching users:", error);
		res.status(500).json({ error: "Server error" });
	}
});

// ✅ Create New User
/*router.post(
	"/",
	authenticateUser,
	authorizeRole(["Admin"]),
	async (req, res) => {
		try {
			const { username, password, role } = req.body;

			// Validate input
			if (!username || !password || !role) {
				return res.status(400).json({ error: "All fields are required" });
			}

			const pool = await sql.connect(dbConfig);
			await pool
				.request()
				.input("username", sql.VarChar, username)
				.input("password", sql.VarChar, password) // Hash password before saving (bcrypt recommended)
				.input("role", sql.VarChar, role)
				.query(
					"INSERT INTO Users (username, password, role) VALUES (@username, @password, @role)"
				);

			res.json({ message: "User created successfully" });
		} catch (error) {
			console.error("Error creating user:", error);
			res.status(500).json({ error: "Database error" });
		}
	}
);

// ✅ Register a new user
/*router.post("/register", async (req, res) => {
	try {
		const { username, password, role } = req.body;

		if (!username || !password || !role) {
			return res.status(400).json({ message: "All fields are required" });
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		const pool = await poolPromise;

		await pool
			.request()
			.input("username", sql.VarChar, username)
			.input("password", sql.VarChar, hashedPassword)
			.input("role", sql.VarChar, role)
			.query(
				"INSERT INTO Users (username, password, role) VALUES (@username, @password, @role)"
			);

		res.status(201).json({ message: "User registered successfully" });
	} catch (error) {
		console.error("Error registering user:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// ✅ Get all users
router.get("/", async (req, res) => {
	try {
		const pool = await poolPromise;
		const result = await pool
			.request()
			.query("SELECT id, username, role FROM Users");

		res.status(200).json(result.recordset);
	} catch (error) {
		console.error("Error fetching users:", error);
		res.status(500).json({ message: "Server error" });
	}
});*/

// ✅ Get a single user by ID
router.get("/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const pool = await poolPromise;

		const result = await pool
			.request()
			.input("id", sql.Int, id)
			.query("SELECT id, username, role FROM Users WHERE id = @id");

		if (result.recordset.length === 0) {
			return res.status(404).json({ message: "User not found" });
		}

		res.status(200).json(result.recordset[0]);
	} catch (error) {
		console.error("Error fetching user:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// ✅ Update a user
router.put("/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const { username, role } = req.body;

		const pool = await poolPromise;
		await pool
			.request()
			.input("id", sql.Int, id)
			.input("username", sql.VarChar, username)
			.input("role", sql.VarChar, role)
			.query(
				"UPDATE Users SET username = @username, role = @role WHERE id = @id"
			);

		res.status(200).json({ message: "User updated successfully" });
	} catch (error) {
		console.error("Error updating user:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// ✅ Delete a user
router.delete("/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const pool = await poolPromise;

		await pool
			.request()
			.input("id", sql.Int, id)
			.query("DELETE FROM Users WHERE id = @id");

		res.status(200).json({ message: "User deleted successfully" });
	} catch (error) {
		console.error("Error deleting user:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// ✅ User login
router.post("/login", async (req, res) => {
	try {
		const { username, password } = req.body;

		if (!username || !password) {
			return res.status(400).json({ message: "All fields are required" });
		}

		const pool = await poolPromise;
		const result = await pool
			.request()
			.input("username", sql.VarChar, username)
			.query("SELECT * FROM Users WHERE username = @username");

		if (result.recordset.length === 0) {
			return res.status(401).json({ message: "Invalid credentials" });
		}

		const user = result.recordset[0];
		const passwordMatch = await bcrypt.compare(password, user.password);

		if (!passwordMatch) {
			return res.status(401).json({ message: "Invalid credentials" });
		}

		// Generate JWT Token
		const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, {
			expiresIn: "1h",
		});

		res.status(200).json({
			token,
			user: { id: user.id, username: user.username, role: user.role },
		});
	} catch (error) {
		console.error("Error logging in:", error);
		res.status(500).json({ message: "Server error" });
	}
});

module.exports = router;
