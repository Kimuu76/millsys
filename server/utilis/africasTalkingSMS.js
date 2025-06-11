/** @format */

const africastalking = require("africastalking");
require("dotenv").config();

const at = africastalking({
	apiKey: process.env.AT_API_KEY,
	username: process.env.AT_USERNAME,
});

const sms = at.SMS;

async function sendSMS(phoneNumber, message) {
	try {
		const response = await sms.send({
			to: [phoneNumber],
			message,
		});

		const recipient = response.SMSMessageData.Recipients[0];

		if (recipient.statusCode === 100) {
			console.log(`✅ SMS delivered to ${phoneNumber}:`, recipient.status);
		} else {
			console.warn(`⚠️ Failed SMS to ${phoneNumber}:`, recipient.status);
		}

		return recipient; // Return for further analysis
	} catch (err) {
		console.error(`❌ Error sending SMS to ${phoneNumber}:`, err);
		return null;
	}
}

module.exports = sendSMS;
