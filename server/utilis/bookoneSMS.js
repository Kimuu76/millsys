/** @format */

// utils/bookoneSMS.js
const axios = require("axios");

function normalizePhoneNumber(phone) {
	phone = phone.trim();
	if (phone.startsWith("+")) return phone.slice(1);
	if (phone.startsWith("0")) return "254" + phone.slice(1);
	return phone;
}

const sendSMS = async (mobile, message) => {
	try {
		const normalized = normalizePhoneNumber(mobile);

		const response = await axios.post(
			"https://sms.bookone.co.ke/api/sms/sendsms",
			{
				mobile: normalized,
				response_type: "json",
				sender_name: "KOSOITAMILK",
				service_id: 0,
				message,
			},
			{
				headers: {
					h_api_key:
						"d0130aa5c7878d2f4b3df3312941903b6b629f6eb20a98ca42c48dcb803ef94c",
					"Content-Type": "application/json",
				},
			}
		);

		const data = response.data?.[0];

		return {
			statusCode: data.status_code,
			status: data.status_desc,
			messageId: data.message_id,
			creditBalance: data.credit_balance,
		};
	} catch (error) {
		console.error("❌ SMS API Error:", error.message || error);
		return {
			statusCode: "1005",
			status: "Internal system error",
		};
	}
};

module.exports = {
	sendSMS,
	normalizePhoneNumber,
};
