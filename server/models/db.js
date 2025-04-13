/** @format */

const sql = require("mssql");
require("dotenv").config();

const dbConfig = {
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	server: process.env.DB_SERVER,
	database: process.env.DB_NAME,
	port: parseInt(process.env.DB_PORT) || 1433, // Ensure it's a number
	options: {
		encrypt: true, // Change to true if using Azure
		trustServerCertificate: true,
	},
	pool: {
		max: 10,
		min: 0,
		idleTimeoutMillis: 30000,
	},
};

// Connect to MSSQL Database
const poolPromise = new sql.ConnectionPool(dbConfig)
	.connect()
	.then((pool) => {
		console.log("Connected to MSSQL Database");
		return pool;
	})
	.catch((err) => console.log("Database Connection Failed!", err));

module.exports = { sql, poolPromise };
