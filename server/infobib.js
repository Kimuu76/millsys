/** @format */

const axios = require("axios");

// Your Infobip credentials
const API_KEY =
	"b74e9cf2736dfe97cf92430e8d090daa-eaf059da-f742-4de4-8a3c-732bd182cfe7";
const BASE_URL = "https://g9jp38.api.infobip.com"; // e.g., https://8z8x2.api.infobip.com

// Phone number format: international (e.g., +2547XXXXXXXX)
const recipient = "+254712992577"; // Replace with Safaricom or Airtel number

const sendSMS = async () => {
	const url = `${BASE_URL}/sms/2/text/advanced`;

	const headers = {
		Authorization: `App ${API_KEY}`,
		"Content-Type": "application/json",
		Accept: "application/json",
	};

	const payload = {
		messages: [
			{
				from: "InfoSMS", // Sender ID must be approved by Infobip
				destinations: [{ to: recipient }],
				text: "Hello from Infobip via Node.js 🚀",
			},
		],
	};

	try {
		const response = await axios.post(url, payload, { headers });
		console.log("✅ SMS sent:", response.data);
	} catch (error) {
		console.error(
			"❌ Error sending SMS:",
			error.response?.data || error.message
		);
	}
};

sendSMS();
