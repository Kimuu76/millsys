/** @format */

const { sql, poolPromise } = require("./db");

const createStockTable = async () => {
	try {
		const pool = await poolPromise;
		await pool.query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Stock' AND xtype='U')
            CREATE TABLE Stock (
                id INT IDENTITY(1,1) PRIMARY KEY,
                product_name NVARCHAR(255) NOT NULL,
                quantity INT DEFAULT 0 CHECK (quantity >= 0) NOT NULL,
                purchase_price DECIMAL(10,2) NOT NULL,
                selling_price DECIMAL(10,2) NOT NULL,
                company_id INT NOT NULL,
                added_at DATETIME DEFAULT GETDATE(),
                FOREIGN KEY (company_id) REFERENCES Companies(id) ON DELETE CASCADE
            )
        `);
		console.log("✅ Stock table checked/created.");
	} catch (error) {
		console.error("❌ Error creating Stock table:", error);
	}
};

module.exports = { createStockTable };
