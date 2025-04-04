/** @format */

const { sql, poolPromise } = require("./db");

// Create Suppliers table if it doesn't exist
const createSuppliersTable = async () => {
	try {
		const pool = await poolPromise;
		await pool.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Suppliers' AND xtype='U')
      CREATE TABLE Suppliers (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        contact NVARCHAR(100) NOT NULL,
        address NVARCHAR(255) NOT NULL,
        company_id INT NOT NULL,
        createdAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (company_id) REFERENCES Companies(id) ON DELETE CASCADE
      )
    `);
		console.log("✅ Suppliers table checked/created.");
	} catch (error) {
		console.log("❌ Error creating Suppliers table:", error);
	}
};

module.exports = { createSuppliersTable };
