/** @format */

const express = require("express");
const sql = require("mssql");
const router = express.Router();
const { poolPromise } = require("../models/db");

// 📌 Manager Requests Deletion
router.post("/request", async (req, res) => {
	try {
		const { item_id, item_type } = req.body;
		const pool = await poolPromise;

		// Get the manager's ID
		const managerResult = await pool
			.request()
			.query("SELECT username FROM Users WHERE role = 'Manager'");

		if (managerResult.recordset.length === 0) {
			return res.status(400).json({ error: "No manager found." });
		}

		const manager_id = managerResult.recordset[0].id;

		await pool
			.request()
			.input("manager_id", sql.Int, manager_id)
			.input("item_id", sql.Int, item_id)
			.input("item_type", sql.VarChar, item_type)
			.input("status", sql.VarChar, "pending").query(`
				INSERT INTO PendingDeletions (manager_id, item_id, item_type, status)
				VALUES (@manager_id, @item_id, @item_type, @status)
			`);

		res
			.status(201)
			.json({ message: "Deletion request submitted for admin approval." });
	} catch (error) {
		console.error("❌ Error submitting deletion request:", error);
		res.status(500).json({ error: "Server error" });
	}
});

// 📌 Admin Fetches Pending Deletions
router.get("/pending", async (req, res) => {
	try {
		const pool = await poolPromise;
		const result = await pool.request().query(`
			SELECT pd.id, pd.manager_id, u.username AS manager_name, pd.item_id, pd.item_type, pd.status, pd.requested_at
			FROM PendingDeletions pd
			JOIN Users u ON pd.manager_id = u.id
			WHERE pd.status = 'pending'
		`);

		res.json(result.recordset);
	} catch (error) {
		console.error("❌ Error fetching pending deletions:", error);
		res.status(500).json({ error: "Server error" });
	}
});

// 📌 Admin Approves or Rejects Deletion
router.post("/review", async (req, res) => {
	try {
		const { request_id, action } = req.body;
		const pool = await poolPromise;

		const requestResult = await pool
			.request()
			.input("request_id", sql.Int, request_id)
			.query("SELECT * FROM PendingDeletions WHERE id = @request_id");

		const request = requestResult.recordset[0];
		if (!request) return res.status(404).json({ error: "Request not found" });

		if (action === "approve") {
			// ✅ Use a parameterized deletion query to prevent SQL injection
			const deleteQuery = `DELETE FROM ${request.item_type} WHERE id = @item_id`;
			await pool
				.request()
				.input("item_id", sql.Int, request.item_id)
				.query(deleteQuery);

			// ✅ Update request status instead of deleting the request immediately
			await pool
				.request()
				.input("request_id", sql.Int, request_id)
				.input("status", sql.VarChar, "approved")
				.query(
					"UPDATE PendingDeletions SET status = @status WHERE id = @request_id"
				);

			console.log(
				`✅ Approved & deleted ${request.item_type} ID: ${request.item_id}`
			);
			res.json({
				message: `Item deleted successfully from ${request.item_type}.`,
			});
		} else if (action === "reject") {
			// ✅ Update status instead of deleting the request immediately
			await pool
				.request()
				.input("request_id", sql.Int, request_id)
				.input("status", sql.VarChar, "rejected")
				.query(
					"UPDATE PendingDeletions SET status = @status WHERE id = @request_id"
				);

			console.log(
				`❌ Deletion request rejected for ${request.item_type} ID: ${request.item_id}`
			);
			res.json({ message: "Deletion request rejected." });
		} else {
			res
				.status(400)
				.json({ error: "Invalid action. Use 'approve' or 'reject'." });
		}
	} catch (error) {
		console.error("❌ Error reviewing deletion request:", error);
		res.status(500).json({ error: "Server error" });
	}
});

module.exports = router;
