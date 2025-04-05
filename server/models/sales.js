/** @format */

const { sql, poolPromise } = require("./db");

// Create Sales table if it doesn't exist
const createSalesTable = async () => {
	try {
		const pool = await poolPromise;
		await pool.query(`
			IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Sales' AND xtype='U')
			CREATE TABLE Sales (
				id INT IDENTITY(1,1) PRIMARY KEY,
				product_name NVARCHAR(255) NOT NULL,
				quantity DECIMAL(10,2) NOT NULL,
				total_price DECIMAL(10,2) NOT NULL,
				company_id INT NOT NULL,  -- 🔥 Added company_id
				sale_date DATETIME DEFAULT GETDATE(),
				FOREIGN KEY (company_id) REFERENCES Companies(id) ON DELETE CASCADE
			)
		`);
		console.log("✅ Sales table checked/created.");
	} catch (error) {
		console.log("❌ Error creating Sales table:", error);
	}
};

module.exports = { createSalesTable };
