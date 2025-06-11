/** @format */

const twilio = require("twilio");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE;

const client = new twilio(accountSid, authToken);

const sendSMS = async (to, message) => {
	try {
		const msg = await client.messages.create({
			body: message,
			from: fromPhone,
			to,
		});
		console.log("SMS sent to:", to);
		return msg.sid;
	} catch (error) {
		console.error("SMS sending error to", to, ":", error.message);
	}
};

module.exports = sendSMS;
