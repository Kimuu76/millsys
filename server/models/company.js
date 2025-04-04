/** @format */

const { sql, poolPromise } = require("./db");

const createCompanyTable = async () => {
	try {
		const pool = await poolPromise;
		await pool.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Companies' AND xtype='U')
      CREATE TABLE Companies (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) UNIQUE NOT NULL,
        email NVARCHAR(255) UNIQUE NOT NULL,
        phone NVARCHAR(50) NOT NULL,
        address NVARCHAR(255),
        owner_name NVARCHAR(255) NOT NULL,
        createdAt DATETIME DEFAULT GETDATE()
      )
    `);
		console.log("✅ Companies table checked/created.");
	} catch (error) {
		console.log("❌ Error creating Companies table:", error);
	}
};

module.exports = { createCompanyTable };
