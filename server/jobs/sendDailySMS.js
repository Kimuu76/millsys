/** @format */

const cron = require("node-cron");
const { sql, dbConfig } = require("../models/db");
const { sendSMS, normalizePhoneNumber } = require("../utilis/bookoneSMS");

// 📅 Format date as dd/mm/yyyy
function formatDate(date) {
	const d = new Date(date);
	const day = String(d.getDate()).padStart(2, "0");
	const month = String(d.getMonth() + 1).padStart(2, "0");
	const year = d.getFullYear();
	return `${day}/${month}/${year}`;
}

// Run every minute (adjust to real schedule)
//cron.schedule("0 18 * * 6", async () => {
cron.schedule(
	"0 18 * * 6",
	async () => {
		console.log("🕕 Running daily SMS job...");
		console.log(
			"triggered at:",
			new Date().toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })
		);

		try {
			const pool = await sql.connect(dbConfig);
			const today = new Date();
			const dayOfWeek = today.getDay(); // 0 = Sunday
			const sunday = new Date(today);
			sunday.setDate(today.getDate() - dayOfWeek);

			// ⏳ For SQL filters (ISO format)
			const isoSundayStr = sunday.toISOString().split("T")[0];
			const isoTodayStr = today.toISOString().split("T")[0];

			// 🗓️ For SMS message (dd/mm/yyyy)
			const smsSundayStr = formatDate(sunday);
			const smsTodayStr = formatDate(today);

			// 1. Fetch per-supplier, per-product daily quantities
			const deliveries = await pool
				.request()
				.input("weekStart", sql.Date, isoSundayStr)
				.input("today", sql.Date, isoTodayStr).query(`
        SELECT s.id AS supplierId, s.name, s.contact AS phoneNumber,
               p.product_name, 
               CONVERT(varchar(10), CAST(p.createdAt AS date), 23) AS deliveryDate,
               SUM(p.quantity) AS quantity
        FROM Purchases p
        JOIN Suppliers s ON p.supplier_id = s.id
        WHERE CAST(p.createdAt AS DATE) BETWEEN @weekStart AND @today
        GROUP BY s.id, s.name, s.contact, p.product_name, CAST(p.createdAt AS DATE);
      `);

			// 2. Organize deliveries
			const supMap = {};
			const days = [...Array(7)].map((_, i) => {
				const d = new Date(sunday);
				d.setDate(sunday.getDate() + i);
				return d.toISOString().split("T")[0]; // use ISO for lookup
			});

			deliveries.recordset.forEach((row) => {
				const key = `${row.supplierId}|${row.product_name}`;
				supMap[key] = supMap[key] || {
					supplierId: row.supplierId,
					name: row.name,
					phone: row.phoneNumber.trim(),
					product: row.product_name,
					daily: {},
				};
				supMap[key].daily[row.deliveryDate] = Number(row.quantity);
			});

			// 3. Send SMS per supplier-product
			for (const entry of Object.values(supMap)) {
				const { supplierId, name, phone, product, daily } = entry;
				if (!phone.startsWith("+254")) {
					console.warn(`⚠️ Invalid phone skipped: ${phone}`);
					continue;
				}

				const stockRes = await pool
					.request()
					.input("product", sql.NVarChar, product).query(`
					SELECT TOP 1 purchase_price
					FROM Stock
					WHERE product_name = @product
					ORDER BY added_at DESC;
				`);

				const rate = stockRes.recordset[0]?.purchase_price;
				if (rate == null) {
					console.warn(
						`⚠️ No rate found for ${product}, supplier ${supplierId}`
					);
					continue;
				}

				function calculateDeductionByAmount(amount) {
					if (amount <= 100) return 0;
					if (amount <= 500) return 10;
					if (amount <= 1000) return 20;
					if (amount <= 2000) return 30;
					if (amount <= 4000) return 40;
					if (amount <= 5000) return 50;
					if (amount <= 9999) return 60;
					return 100;
				}

				let totalQty = 0,
					breakdown = "";
				const weekdayLabels = [
					"Sunday",
					"Monday",
					"Tuesday",
					"Wednesday",
					"Thursday",
					"Friday",
					"Saturday",
				];

				for (let i = 0; i < days.length && days[i] <= isoTodayStr; i++) {
					const date = days[i];
					const qty = daily[date] || 0;
					totalQty += qty;

					const formattedDate = formatDate(date);
					breakdown += `DAY ${i + 1} (${weekdayLabels[i]} ): ${qty}L\n`;
				}

				const gross = totalQty * rate;
				const deduction = calculateDeductionByAmount(gross);
				const net = gross - deduction;

				const message =
					`Kertai Milk Records from:\n` +
					`Week: ${smsSundayStr} To ${smsTodayStr}\n` +
					`Product: ${product}\n` +
					`${breakdown}Total: ${totalQty}L\n` +
					`Rate: ${rate.toFixed(2)} KES/L\n` +
					`Total Amount: ${gross.toFixed(2)} KES\n` +
					`Charges : ${deduction.toFixed(2)} KES\n` +
					`Net Pay: ${net.toFixed(2)} KES\n` +
					`By Management: 0720369014`;

				const smsResult = await sendSMS(phone, message);
				if (smsResult?.statusCode !== 100) {
					console.warn(
						`⚠️ SMS not delivered to ${phone}. Status code: ${smsResult?.status}`
					);

					if (smsResult?.status === "UserInBlacklist") {
						try {
							await pool
								.request()
								.input("supplier_id", sql.Int, supplierId)
								.input("phone", sql.NVarChar(100), phone)
								.input("message", sql.NVarChar(sql.MAX), message)
								.input("error", sql.NVarChar(255), smsResult.status).query(`
								INSERT INTO DNDLogs (supplier_id, phone, message, error)
								VALUES (@supplier_id, @phone, @message, @error)
							`);
							console.log(`📵 DND logged for ${phone}`);
						} catch (logError) {
							console.error(
								`❌ Failed to log DND for ${phone}:`,
								logError.message
							);
						}
					}
				} else {
					console.log(`✅ SMS sent to ${phone} about ${product}`);
				}
			}

			// ADMIN DAILY REPORT
			const ADMIN_PHONE = "254712992577";

			const dailyReportRes = await pool.request().query(`
			SELECT 
				'Total Purchases (Intake)' AS type, SUM(quantity) AS quantity, NULL AS total_price
			FROM Purchases
			WHERE CAST(createdAt AS DATE) = '${isoTodayStr}'
			UNION
			SELECT 'Total Sales (Liters)', SUM(quantity), NULL
			FROM Sales
			WHERE CAST(sale_date AS DATE) = '${isoTodayStr}'
			UNION
			SELECT 'Sales to Brookside', NULL, SUM(total_price)
			FROM Sales
			WHERE customer = 'Brookside' AND CAST(sale_date AS DATE) = '${isoTodayStr}'
			UNION
			SELECT 'Sales to Local Customers', NULL, SUM(total_price)
			FROM Sales
			WHERE customer = 'Local' AND CAST(sale_date AS DATE) = '${isoTodayStr}'
		`);

			const purchaseQty =
				dailyReportRes.recordset.find(
					(r) => r.type === "Total Purchases (Intake)"
				)?.quantity || 0;
			const salesQty =
				dailyReportRes.recordset.find((r) => r.type === "Total Sales (Liters)")
					?.quantity || 0;
			const brooksideSales =
				dailyReportRes.recordset.find((r) => r.type === "Sales to Brookside")
					?.total_price || 0;
			const localSales =
				dailyReportRes.recordset.find(
					(r) => r.type === "Sales to Local Customers"
				)?.total_price || 0;

			const cumulativeSales = brooksideSales + localSales;
			const variance = salesQty - purchaseQty;

			const summary = [
				{ label: "Total Intake (Liters)", value: purchaseQty },
				{ label: "Total Sales (Liters)", value: salesQty },
				{ label: "Brookside Sales", value: `KES ${brooksideSales.toFixed(2)}` },
				{ label: "Local Sales", value: `KES ${localSales.toFixed(2)}` },
				{
					label: "Cumulative Sales",
					value: `KES ${cumulativeSales.toFixed(2)}`,
				},
				{
					label: "Variance (Sales - Intake)",
					value: `${variance.toFixed(2)} Liters`,
				},
			];

			const dailyMessage =
				`📊 *Daily Report Summary (${smsTodayStr})*\n----------------------------\n` +
				summary
					.map((item) => {
						const emoji = item.label.toLowerCase().includes("variance")
							? "⚠️"
							: item.label.toLowerCase().includes("sales")
							? "💰"
							: "✅";
						return `${emoji} *${item.label}*: ${item.value}`;
					})
					.join("\n");

			const dailySmsResult = await sendSMS(ADMIN_PHONE, dailyMessage);

			if (dailySmsResult?.statusCode === 100) {
				console.log(`✅ Daily summary sent to admin (${ADMIN_PHONE})`);
			} else {
				console.warn(`⚠️ Daily summary SMS failed: ${dailySmsResult?.status}`);
				console.warn("🔍 SMS Response:", dailySmsResult);
			}

			// WEEKLY SUMMARY SMS
			const weekStart = new Date();
			weekStart.setDate(weekStart.getDate() - weekStart.getDay());
			const weekEnd = new Date(weekStart);
			weekEnd.setDate(weekEnd.getDate() + 6);

			const startStr = formatDate(weekStart);
			const endStr = formatDate(weekEnd);
			const isoWeekStart = weekStart.toISOString().split("T")[0];
			const isoWeekEnd = weekEnd.toISOString().split("T")[0];

			const totals = await pool.request().query(`
			SELECT 
				COUNT(DISTINCT supplier_id) AS supplierCount,
				SUM(quantity) AS totalLitres
			FROM Purchases
			WHERE CAST(createdAt AS DATE) BETWEEN '${isoWeekStart}' AND '${isoWeekEnd}'
		`);

			const { supplierCount, totalLitres } = totals.recordset[0] || {};

			const totalAmountRow = await pool.request().query(`
			SELECT 
				SUM(p.quantity * s.purchase_price) AS gross
			FROM Purchases p
			JOIN Stock s ON p.product_name = s.product_name AND p.company_id = s.company_id
			WHERE CAST(p.createdAt AS DATE) BETWEEN '${isoWeekStart}' AND '${isoWeekEnd}'
		`);

			let gross = totalAmountRow.recordset[0]?.gross || 0;
			let deduction = calculateDeductionByAmount(gross);
			let net = gross - deduction;

			const dndResult = await pool.request().query(`
			SELECT COUNT(*) AS dndCount 
			FROM DNDLogs 
			WHERE logged_at BETWEEN '${isoWeekStart}' AND '${isoWeekEnd}'
		`);

			const dndCount = dndResult.recordset[0]?.dndCount || 0;

			const summaryMsg = `📊 Kertai Choronok Milk Center Weekly Summary
🗓️ Week: ${startStr} to ${endStr}
👥 Farmers: ${supplierCount}
🥛 Total Milk: ${totalLitres || 0} L
💰 Paid: KES ${net.toFixed(2)}
📵 DND (not reached): ${dndCount}`;

			const adminSmsResult = await sendSMS(ADMIN_PHONE, summaryMsg);

			if (adminSmsResult?.statusCode === 100) {
				console.log(`✅ Summary sent to admin (${ADMIN_PHONE})`);
			} else {
				console.warn(`⚠️ Summary SMS failed: ${adminSmsResult?.status}`);
				console.warn("🔍 SMS Response:", adminSmsResult);
			}

			console.log("✅ Weekly SMS job completed.");
		} catch (err) {
			console.error("❌ Error in SMS job:", err.message || err);
		}
	},
	{
		timezone: "Africa/Nairobi",
	}
);
