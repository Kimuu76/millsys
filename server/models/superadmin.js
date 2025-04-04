/** @format */
const { sql, poolPromise } = require("./db");
const bcrypt = require("bcryptjs");

const createSuperAdminTable = async () => {
	try {
		const pool = await poolPromise;
		await pool.query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SuperAdmins' AND xtype='U')
            CREATE TABLE SuperAdmins (
                id INT IDENTITY(1,1) PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL
            )
        `);

		console.log("✅ SuperAdmin table checked/created.");

		// **🔹 Check if SuperAdmin exists**
		const result = await pool
			.request()
			.query("SELECT COUNT(*) AS count FROM SuperAdmins");

		if (result.recordset[0].count === 0) {
			// **🔹 Hash password before inserting**
			const hashedPassword = await bcrypt.hash("kevtech7544#", 10);

			await pool
				.request()
				.input("username", sql.NVarChar, "kevtechsuperadmin")
				.input("password", sql.NVarChar, hashedPassword)
				.query(
					"INSERT INTO SuperAdmins (username, password) VALUES (@username, @password)"
				);

			console.log(
				"✅ Default SuperAdmin created (Username: superadmin, Password: Super@123)"
			);
		} else {
			console.log("✅ SuperAdmin already exists.");
		}
	} catch (error) {
		console.error("❌ Error creating SuperAdmin table:", error);
	}
};

module.exports = { createSuperAdminTable };

/** @format 

const { sql, poolPromise } = require("./db");

// ✅ Create SuperAdmin Table
const createSuperAdminTable = async () => {
	try {
		const pool = await poolPromise;

		await pool.query(`
			IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SuperAdmins' AND xtype='U')
			CREATE TABLE SuperAdmins (
				id INT IDENTITY(1,1) PRIMARY KEY,
				username VARCHAR(50) UNIQUE NOT NULL,
				password VARCHAR(255) NOT NULL,
				email VARCHAR(100) UNIQUE NOT NULL,
				phone VARCHAR(20) NOT NULL,
				created_at DATETIME DEFAULT GETDATE()
			)
		`);

		console.log("✅ SuperAdmins table checked/created.");
	} catch (error) {
		console.log("❌ Error creating SuperAdmins table:", error);
	}
};

module.exports = { createSuperAdminTable };*/
