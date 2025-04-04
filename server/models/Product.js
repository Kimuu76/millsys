/** @format */
const { sql, poolPromise } = require("./db");

const createProductTable = async () => {
	try {
		const pool = await poolPromise;

		// ✅ Create Products Table if it doesn't exist
		await pool.query(`
			IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Products')
			BEGIN
				CREATE TABLE Products (
					id INT IDENTITY(1,1) PRIMARY KEY,
					name VARCHAR(100) NOT NULL,
					company_id INT NOT NULL,
					CONSTRAINT FK_Company_Products FOREIGN KEY (company_id) REFERENCES Companies(id) ON DELETE CASCADE
				)
			END
		`);

		// ✅ Ensure Uniqueness per Company
		await pool.query(`
			IF NOT EXISTS (
				SELECT * FROM sys.indexes WHERE name = 'UQ_Product_Company'
			)
			CREATE UNIQUE INDEX UQ_Product_Company ON Products (name, company_id);
		`);

		console.log("✅ Products table checked/created.");
	} catch (error) {
		console.log("❌ Error creating Products table:", error);
	}
};

module.exports = { createProductTable };
