/** @format */

const express = require("express");
const { sql, poolPromise } = require("../models/db");
const {
	authenticateUser,
	authorizeRole,
	verifyCompanyAccess,
} = require("../middlewares/authMiddleware");

const router = express.Router();

// Get all suppliers
router.get("/", authenticateUser, async (req, res) => {
	try {
		const pool = await poolPromise;
		const result = await pool
			.request()
			.input("company_id", sql.Int, req.user.company_id) // ✅ Restrict by company
			.query(
				"SELECT * FROM Suppliers WHERE company_id = @company_id ORDER BY createdAt DESC"
			);
		res.json(result.recordset);
	} catch (error) {
		console.error("❌ Error fetching suppliers:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

// Create a new supplier
router.post("/", authenticateUser, async (req, res) => {
	try {
		const { name, contact, address } = req.body;

		if (!name || !contact || !address) {
			return res.status(400).json({ error: "All fields are required" });
		}

		const pool = await poolPromise;
		const result = await pool
			.request()
			.input("name", sql.NVarChar(255), name)
			.input("contact", sql.NVarChar(100), contact)
			.input("address", sql.NVarChar(255), address)
			.input("company_id", sql.Int, req.user.company_id) // ✅ Add company_id
			.query(
				"INSERT INTO Suppliers (name, contact, address, company_id) VALUES (@name, @contact, @address, @company_id); SELECT SCOPE_IDENTITY() AS id;"
			);

		if (result.recordset.length > 0) {
			res.status(201).json({
				message: "✅ Supplier created successfully",
				supplierId: result.recordset[0].id,
			});
		} else {
			throw new Error("❌ Failed to retrieve the new supplier ID.");
		}
	} catch (error) {
		console.error("❌ Error creating supplier:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

router.post("/import", authenticateUser, async (req, res) => {
	try {
		const { suppliers } = req.body;
		if (!Array.isArray(suppliers) || suppliers.length === 0) {
			return res.status(400).json({ error: "No supplier data provided." });
		}

		const pool = await poolPromise;
		for (const supplier of suppliers) {
			const { name, contact, address } = supplier;

			if (!name || !contact || !address) continue; // skip invalid

			await pool
				.request()
				.input("name", sql.NVarChar(255), name)
				.input("contact", sql.NVarChar(100), contact)
				.input("address", sql.NVarChar(255), address)
				.input("company_id", sql.Int, req.user.company_id)
				.query(
					`INSERT INTO Suppliers (name, contact, address, company_id)
					 VALUES (@name, @contact, @address, @company_id)`
				);
		}

		res.status(201).json({ message: "✅ Suppliers imported successfully." });
	} catch (error) {
		console.error("❌ Import error:", error);
		res.status(500).json({ error: "Server error during import." });
	}
});

// Update supplier
router.put("/:id", authenticateUser, async (req, res) => {
	try {
		const { id } = req.params;
		const { name, contact, address } = req.body;

		const pool = await poolPromise;

		// Check ownership
		const supplierCheck = await pool
			.request()
			.input("id", sql.Int, id)
			.input("company_id", sql.Int, req.user.company_id)
			.query(
				"SELECT * FROM Suppliers WHERE id = @id AND company_id = @company_id"
			);

		if (supplierCheck.recordset.length === 0) {
			return res
				.status(403)
				.json({ error: "Unauthorized or supplier not found." });
		}

		await pool
			.request()
			.input("id", sql.Int, id)
			.input("name", sql.NVarChar(255), name)
			.input("contact", sql.NVarChar(100), contact)
			.input("address", sql.NVarChar(255), address)
			.input("company_id", sql.Int, req.user.company_id)
			.query(
				`UPDATE Suppliers 
				SET name = @name, contact = @contact, address = @address 
				WHERE id = @id AND company_id = @company_id`
			);

		res.json({ message: "✅ Supplier updated successfully." });
	} catch (error) {
		console.error("❌ Error updating supplier:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

// Delete supplier
router.delete(
	"/:id",
	authenticateUser,
	authorizeRole(["Admin"]),
	async (req, res) => {
		const { id } = req.params;

		try {
			const pool = await poolPromise;

			// ✅ Ensure the supplier belongs to the logged-in user's company
			const supplierResult = await pool
				.request()
				.input("id", sql.Int, id)
				.input("company_id", sql.Int, req.user.company_id)
				.query(
					"SELECT * FROM Suppliers WHERE id = @id AND company_id = @company_id"
				);

			if (supplierResult.recordset.length === 0) {
				return res.status(403).json({ error: "Unauthorized supplier access." });
			}

			await pool
				.request()
				.input("id", sql.Int, id)
				.input("company_id", sql.Int, req.user.company_id)
				.query(
					"DELETE FROM Suppliers WHERE id = @id AND company_id = @company_id"
				);

			res.json({ message: "✅ Supplier deleted successfully." });
		} catch (error) {
			console.error("❌ Error deleting supplier:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	}
);

module.exports = router;
