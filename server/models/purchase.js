/** @format */
const { sql, poolPromise } = require("./db");

const createPurchasesTable = async () => {
	try {
		const pool = await poolPromise;

		// ✅ Ensure Purchases Table Exists
		await pool.query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Purchases' AND xtype='U')
            BEGIN
                CREATE TABLE Purchases (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    product_name NVARCHAR(255) NOT NULL,
                    supplier_id INT NOT NULL,
                    quantity DECIMAL(10,2) NOT NULL,
                    purchase_price DECIMAL(10,2) NOT NULL,
                    total DECIMAL(10,2) NOT NULL,
                    company_id INT NOT NULL,
                    return_quantity DECIMAL(10,2) DEFAULT 0,
                    createdAt DATETIME DEFAULT GETDATE(),
                    FOREIGN KEY (supplier_id) REFERENCES Suppliers(id),
                    FOREIGN KEY (company_id) REFERENCES Companies(id) ON DELETE CASCADE
                );
            END
        `);

		// ✅ Ensure 'status' column exists
		await pool.query(`
            IF NOT EXISTS (
                SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'Purchases' AND COLUMN_NAME = 'status'
            )
            BEGIN
                ALTER TABLE Purchases ADD status NVARCHAR(20) DEFAULT 'Not Paid';
            END
        `);

		// ✅ Ensure 'return_quantity' column exists
		await pool.query(`
            IF NOT EXISTS (
                SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'Purchases' AND COLUMN_NAME = 'return_quantity'
            )
            BEGIN
                ALTER TABLE Purchases ADD return_quantity INT DEFAULT 0;
            END
        `);

		console.log(
			"✅ Purchases table checked/created with 'status' and 'return_quantity' columns."
		);
	} catch (error) {
		console.error("❌ Error creating/updating Purchases table:", error);
	}
};

module.exports = { createPurchasesTable };
