/** @format */

const sendSMS = require("./utilis/africasTalkingSMS");

(async () => {
	await sendSMS("+254756308576", "Hello, this is a one-time live test!");
})();
