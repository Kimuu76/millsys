/** @format */

const sendSMS = require("./utilis/africasTalkingSMS");

(async () => {
	await sendSMS("+254112283640", "Hello, this is a one-time live test!");
})();
