/** @format */

const sql = require("mssql");
const { poolPromise } = require("./db");

// Function to create the PendingDeletions table
const createPendingDeletionsTable = async () => {
	try {
		const pool = await poolPromise;
		await pool.request().query(`
			IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PendingDeletions' AND xtype='U')
			CREATE TABLE PendingDeletions (
				id INT IDENTITY(1,1) PRIMARY KEY,
				manager_id INT NOT NULL,
				item_id INT NOT NULL,
				item_type VARCHAR(50) NOT NULL,
				status VARCHAR(20) DEFAULT 'pending',
				requested_at DATETIME DEFAULT GETDATE(),
				FOREIGN KEY (manager_id) REFERENCES Users(id) ON DELETE CASCADE
			);
		`);
		console.log("✅ PendingDeletions table is ready.");
	} catch (error) {
		console.error("❌ Error creating PendingDeletions table:", error);
	}
};

module.exports = { createPendingDeletionsTable };
