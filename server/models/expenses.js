/** @format */

const { sql, poolPromise } = require("./db");

// ✅ Create Expenses Table if not exists
const createExpensesTable = async () => {
	try {
		const pool = await poolPromise;
		await pool.query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Expenses' AND xtype='U')
            CREATE TABLE Expenses (
                id INT IDENTITY(1,1) PRIMARY KEY,
                category NVARCHAR(255) NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                description NVARCHAR(500),
                createdAt DATETIME DEFAULT GETDATE(),
                company_id INT NOT NULL,
                FOREIGN KEY (company_id) REFERENCES Companies(id) ON DELETE CASCADE
            )
        `);
		console.log("✅ Expenses table checked/created.");
	} catch (error) {
		console.error("❌ Error creating Expenses table:", error);
	}
};

module.exports = { createExpensesTable };
