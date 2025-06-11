/** @format */

// In your migration or setup file
const { sql, poolPromise } = require("./db");

const setupWeeklyDeliveries = async () => {
	const pool = await poolPromise;

	await pool.query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='WeeklyDeliveries' AND xtype='U')
    BEGIN
      CREATE TABLE WeeklyDeliveries (
        id INT IDENTITY(1,1) PRIMARY KEY,
        supplier_id INT NOT NULL,
        total_quantity DECIMAL(10,2) DEFAULT 0,
        week_start_date DATE NOT NULL,
        FOREIGN KEY (supplier_id) REFERENCES Suppliers(id) ON DELETE CASCADE
      )
    END
  `);

	console.log("✅ WeeklyDeliveries table ready.");
};

module.exports = { setupWeeklyDeliveries };
