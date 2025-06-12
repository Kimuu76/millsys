/** @format */
const { sql, poolPromise } = require("./db");

const createDNDLogsTable = async () => {
	try {
		const pool = await poolPromise;

		await pool.query(`
			IF NOT EXISTS (
				SELECT * FROM sysobjects WHERE name='DNDLogs' AND xtype='U'
			)
			CREATE TABLE DNDLogs (
				id INT IDENTITY(1,1) PRIMARY KEY,
				supplier_id INT NOT NULL,
				phone NVARCHAR(100) NOT NULL,
				message NVARCHAR(MAX),
				error NVARCHAR(255),
				logged_at DATETIME DEFAULT GETDATE()
			)
		`);
		console.log("✅ DNDLogs table checked/created.");
	} catch (err) {
		console.error("❌ Failed to create DNDLogs table:", err);
	}
};

module.exports = { createDNDLogsTable };
