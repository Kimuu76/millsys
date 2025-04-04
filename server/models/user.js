/** @format */
const { sql, poolPromise } = require("./db");

const createUserTable = async () => {
	try {
		const pool = await poolPromise;

		// ✅ Create Users Table if it doesn't exist
		await pool.query(`
			IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Users')
			BEGIN
				CREATE TABLE Users (
					id INT IDENTITY(1,1) PRIMARY KEY,
					username VARCHAR(50) UNIQUE NOT NULL,
					password VARCHAR(255) NOT NULL,
					role VARCHAR(50) NOT NULL DEFAULT 'Cashier',
					company_id INT NOT NULL,
					CONSTRAINT FK_Company_Users FOREIGN KEY (company_id) REFERENCES Companies(id) ON DELETE CASCADE
				)
			END
		`);

		console.log("✅ Users table checked/created.");
	} catch (error) {
		console.log("❌ Error creating Users table:", error);
	}
};

module.exports = { createUserTable };

/** @format 

const { sql, poolPromise } = require("./db");

const createUserTable = async () => {
	try {
		const pool = await poolPromise;
		await pool.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
      CREATE TABLE Users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'Cashier'
        company_id INT NOT NULL,
         CONSTRAINT FK_Company FOREIGN KEY (company_id) REFERENCES Companies(id) ON DELETE CASCADE
      )
    `);
		console.log("Users table checked/created.");
	} catch (error) {
		console.log("Error creating Users table:", error);
	}
};

module.exports = { createUserTable };*/
