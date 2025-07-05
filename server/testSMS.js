/** @format */

// testSMS.js
const { sendSMS } = require("./utilis/bookoneSMS"); // adjust path if needed

(async () => {
	const result = await sendSMS("254713163359", "Hello from KOSOITA MILK!");
	console.log("SMS Result:", result);
})();
