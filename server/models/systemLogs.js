/** @format */

const { sql, poolPromise } = require("./db");

// ✅ Create System Logs Table
const createSystemLogsTable = async () => {
	try {
		const pool = await poolPromise;
		await pool.query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SystemLogs' AND xtype='U')
            CREATE TABLE SystemLogs (
                id INT IDENTITY(1,1) PRIMARY KEY,
                action NVARCHAR(255) NOT NULL,
                performed_by NVARCHAR(50) NOT NULL,
                created_at DATETIME DEFAULT GETDATE() -- ✅ Add Timestamp Column
            )
        `);
		console.log("✅ SystemLogs table checked/created.");
	} catch (error) {
		console.error("❌ Error creating SystemLogs table:", error);
	}
};

// ✅ Function to Insert Logs
const insertSystemLog = async (action, performed_by) => {
	try {
		const pool = await poolPromise;
		await pool
			.request()
			.input("action", sql.NVarChar, action)
			.input("performed_by", sql.NVarChar, performed_by)
			.query(
				"INSERT INTO SystemLogs (action, performed_by) VALUES (@action, @performed_by)"
			);
		console.log("✅ Log inserted:", action);
	} catch (error) {
		console.log("❌ Error inserting log:", error);
	}
};

module.exports = { createSystemLogsTable, insertSystemLog };
