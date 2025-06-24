/** @format */

const sendSMS = require("./utilis/africasTalkingSMS");

(async () => {
	await sendSMS("+254712992577", "Hello, this is a one-time live test!");
})();
