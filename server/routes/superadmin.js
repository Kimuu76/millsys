/** @format */
const express = require("express");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const { sql, poolPromise } = require("../models/db");
const { authenticateSuperAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();
const backupDir = path.join(__dirname, "../backups");

// ✅ Ensure backup directory exists
if (!fs.existsSync(backupDir)) {
	fs.mkdirSync(backupDir);
}

/** ✅ Get Super Admin Stats */
router.get("/stats", authenticateSuperAdmin, async (req, res) => {
	try {
		const pool = await poolPromise;

		const companiesResult = await pool.query(
			"SELECT COUNT(*) AS total_companies FROM Companies"
		);
		const usersResult = await pool.query(
			"SELECT COUNT(*) AS total_admins FROM Users WHERE role = 'Admin'"
		);

		/*const usersResult = await pool.query(
			"SELECT COUNT(*) AS total_users FROM Users"
		);*/

		res.json({
			total_companies: companiesResult.recordset[0]?.total_companies || 0,
			total_admins: usersResult.recordset[0]?.total_admins || 0,
		});
	} catch (error) {
		console.error("❌ Error fetching SuperAdmin stats:", error);
		res.status(500).json({ error: "Server error" });
	}
});

/** ✅ Get All Admin Users with Company Details */
router.get("/admins", authenticateSuperAdmin, async (req, res) => {
	try {
		const pool = await poolPromise;

		// Fetch Admins with Company Name & Address
		const result = await pool.query(`
			SELECT Users.id, Users.username, Users.role, 
				   Companies.name AS company_name, Companies.address AS company_address
			FROM Users
			JOIN Companies ON Users.company_id = Companies.id
			WHERE Users.role = 'Admin'
		`);

		res.json(result.recordset);
	} catch (error) {
		console.error("❌ Error fetching Admin users:", error);
		res.status(500).json({ error: "Server error" });
	}
});

/** ✅ Delete Admin & Their Company */
router.delete("/admins/:id", authenticateSuperAdmin, async (req, res) => {
	try {
		const { id } = req.params;
		const pool = await poolPromise;

		// 🔍 Find the company associated with the Admin
		const adminResult = await pool
			.request()
			.input("id", sql.Int, id)
			.query("SELECT company_id FROM Users WHERE id = @id AND role = 'Admin'");

		// ❌ If Admin not found, return an error
		if (adminResult.recordset.length === 0) {
			return res.status(404).json({ error: "Admin not found." });
		}

		const companyId = adminResult.recordset[0].company_id;

		// ✅ Delete Company (Cascade deletes all related data)
		await pool
			.request()
			.input("companyId", sql.Int, companyId)
			.query("DELETE FROM Companies WHERE id = @companyId");

		res.json({ message: "✅ Admin and Company deleted successfully." });
	} catch (error) {
		console.error("❌ Error deleting Admin and Company:", error);
		res.status(500).json({ error: "Server error" });
	}
});

/** ✅ Create Database Backup */
router.post("/backup", authenticateSuperAdmin, async (req, res) => {
	try {
		const SERVER_NAME = "mssql-194048-0.cloudclusters.net,10131";
		const DATABASE_NAME = "kim";
		const DB_USERNAME = "kim";
		const DB_PASSWORD = "Bett7544@";

		const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
		const backupFile = path.join(backupDir, `backup-${timestamp}.bak`);

		// ✅ Corrected SQLCMD command
		const command = `sqlcmd -S ${SERVER_NAME} -U ${DB_USERNAME} -P ${DB_PASSWORD} -Q "BACKUP DATABASE ${DATABASE_NAME} TO DISK='${backupFile}' WITH FORMAT, INIT"`;

		exec(command, (error) => {
			if (error) {
				console.error("❌ Backup error:", error);
				return res.status(500).json({ error: "Backup failed" });
			}
			res.json({ message: "✅ Backup completed successfully!" });
		});
	} catch (error) {
		console.error("❌ Error creating backup:", error);
		res.status(500).json({ error: "Server error" });
	}
});

/** ✅ Restore Database from Backup */
router.post("/restore", authenticateSuperAdmin, async (req, res) => {
	try {
		const { backupFile } = req.body;
		const filePath = path.join(backupDir, backupFile);

		if (!fs.existsSync(filePath)) {
			return res.status(400).json({ error: "Backup file not found" });
		}

		// Adjust this command based on your database
		const command = `sqlcmd -S YOUR_SERVER -d master -Q "RESTORE DATABASE YOUR_DATABASE FROM DISK='${filePath}' WITH REPLACE"`;

		exec(command, (error) => {
			if (error) {
				console.error("❌ Restore error:", error);
				return res.status(500).json({ error: "Restore failed" });
			}
			res.json({ message: "✅ Database restored successfully!" });
		});
	} catch (error) {
		console.error("❌ Error restoring database:", error);
		res.status(500).json({ error: "Server error" });
	}
});

/** ✅ Get List of Backups */
router.get("/backups", authenticateSuperAdmin, (req, res) => {
	fs.readdir(backupDir, (err, files) => {
		if (err) {
			console.error("❌ Error reading backups:", err);
			return res.status(500).json({ error: "Failed to fetch backups" });
		}

		// ✅ Ensure only .bak files are displayed
		const backupFiles = files
			.filter((file) => file.endsWith(".bak"))
			.map((file) => ({
				name: file,
				path: path.join(backupDir, file), // Include full path
			}));

		if (backupFiles.length === 0) {
			return res.status(404).json({ message: "No backups available." });
		}

		res.json(backupFiles);
	});
});

/** ✅ Clear System Logs */
router.post("/clear-logs", authenticateSuperAdmin, async (req, res) => {
	try {
		const pool = await poolPromise;
		await pool.query(`
            DELETE FROM SystemLogs WHERE created_at < DATEADD(DAY, -30, GETDATE())
        `);
		res.json({ message: "✅ Old logs cleared successfully!" });
	} catch (error) {
		console.error("❌ Error clearing logs:", error);
		res.status(500).json({ error: "Failed to clear logs" });
	}
});

module.exports = router;
