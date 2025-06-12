/** @format */

const cron = require("node-cron");
const { sql, dbConfig } = require("../models/db");
const sendSMS = require("../utilis/africasTalkingSMS");

// Run every saturday at 6 PM
cron.schedule("0 18 * * 6", async () => {
	console.log("🕕 Running daily SMS job...");

	try {
		const pool = await sql.connect(dbConfig);
		const today = new Date();
		const dayOfWeek = today.getDay(); // 0 = Sunday
		const sunday = new Date(today);
		sunday.setDate(today.getDate() - dayOfWeek);
		const sundayStr = sunday.toISOString().split("T")[0];
		const todayStr = today.toISOString().split("T")[0];

		// 1. Fetch per-supplier, per-product daily quantities
		const deliveries = await pool
			.request()
			.input("weekStart", sql.Date, sundayStr)
			.input("today", sql.Date, todayStr).query(`
        SELECT s.id AS supplierId, s.name, s.contact AS phoneNumber,
               p.product_name, 
               CONVERT(varchar(10), CAST(p.createdAt AS date), 23) AS deliveryDate,
               SUM(p.quantity) AS quantity
        FROM Purchases p
        JOIN Suppliers s ON p.supplier_id = s.id
        WHERE CAST(p.createdAt AS DATE) BETWEEN @weekStart AND @today
        GROUP BY s.id, s.name, s.contact, p.product_name, CAST(p.createdAt AS DATE);
      `);

		// 2. Organize deliveries by supplier and product
		const supMap = {};
		const days = [...Array(7)].map((_, i) => {
			const d = new Date(sunday);
			d.setDate(sunday.getDate() + i);
			return d.toISOString().split("T")[0];
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

		// 3. Send SMS per supplier-product group
		for (const entry of Object.values(supMap)) {
			const { supplierId, name, phone, product, daily } = entry;
			if (!phone.startsWith("+254")) {
				console.warn(`⚠️ Invalid phone skipped: ${phone}`);
				continue;
			}

			// Fetch this product’s latest purchase_price for this supplier
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
				console.warn(`⚠️ No rate found for ${product}, supplier ${supplierId}`);
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

			// Build message
			let totalQty = 0,
				breakdown = "",
				day = 1;
			for (const date of days) {
				if (date > todayStr) break;
				const qty = daily[date] || 0;
				totalQty += qty;
				breakdown += `DAY ${day}: ${qty}L\n`;
				day++;
			}

			const gross = totalQty * rate;
			const deduction = calculateDeductionByAmount(gross);
			const net = gross - deduction;

			const message =
				`Kertai Choronok Milk Center\n` +
				`Week: ${sundayStr} To ${todayStr}\n` +
				`Product: ${product}\n` +
				`${breakdown}Total: ${totalQty}L\n` +
				`Rate: ${rate.toFixed(2)} KES/L\n` +
				`Total Amount: ${gross.toFixed(2)} KES\n` +
				`Charges : ${deduction.toFixed(2)} KES\n` +
				`Net Pay: ${net.toFixed(2)} KES\n` +
				`Thank you ${name}!`;

			const smsResult = await sendSMS(phone, message);
			if (smsResult?.statusCode !== 100) {
				console.warn(`⚠️ SMS not delivered to ${phone}: ${smsResult.status}`);
			} else {
				console.log(`✅ SMS sent to ${phone} about ${product}`);
			}
		}

		console.log("✅ Weekly SMS job completed.");
	} catch (err) {
		console.error("❌ Error in SMS job:", err.message || err);
	}
});

/** @format 

const cron = require("node-cron");
const { sql, dbConfig } = require("../models/db");
const sendSMS = require("../utilis/africasTalkingSMS");

// Run daily at 6 PM
cron.schedule("* * * * *", async () => {
	console.log("🕕 Running daily SMS job...");

	try {
		const pool = await sql.connect(dbConfig);
		const today = new Date();

		// Get the most recent Sunday (start of the week)
		const dayOfWeek = today.getDay(); // 0 = Sunday
		const sunday = new Date(today);
		sunday.setDate(today.getDate() - dayOfWeek); // Sunday this week

		const sundayStr = sunday.toISOString().split("T")[0];
		const todayStr = today.toISOString().split("T")[0];

		const result = await pool
			.request()
			.input("weekStart", sql.Date, sundayStr)
			.input("today", sql.Date, todayStr).query(`
				SELECT 
					s.id AS supplierId,
					s.name,
					s.contact AS phoneNumber,
					CONVERT(varchar(10), CAST(p.createdAt AS date), 23) AS deliveryDate,
					SUM(p.quantity) AS quantity,
					AVG(st.purchase_price) AS avgPrice
				FROM Purchases p
				JOIN Suppliers s ON p.supplier_id = s.id
				JOIN Stock st ON p.product_name = st.product_name
				WHERE CAST(p.createdAt AS DATE) BETWEEN @weekStart AND @today
				GROUP BY s.id, s.name, s.contact, CAST(p.createdAt AS DATE);
			`);

		const days = [...Array(7)].map((_, i) => {
			const d = new Date(sunday);
			d.setDate(sunday.getDate() + i);
			return d.toISOString().split("T")[0];
		});

		const grouped = result.recordset.reduce((acc, row) => {
			const key = row.supplierId;
			acc[key] = acc[key] || {
				name: row.name,
				phone: row.phoneNumber.trim(),
				daily: {},
				avgPrice: row.avgPrice,
			};
			acc[key].daily[row.deliveryDate] = row.quantity;
			return acc;
		}, {});

		for (const supplier of Object.values(grouped)) {
			const { name, phone, daily, avgPrice } = supplier;
			if (!phone.startsWith("+254")) {
				console.warn(`⚠️ Invalid phone skipped: ${phone}`);
				continue;
			}

			let totalQty = 0;
			let breakdown = "";
			let dayCounter = 1;

			for (let i = 0; i < days.length && days[i] <= todayStr; i++) {
				const date = days[i];
				const qty = Number(daily[date] || 0);
				totalQty += qty;
				breakdown += `DAY ${dayCounter}: ${qty}L\n`;
				dayCounter++;
			}

			const rate = avgPrice || 0;
			const gross = totalQty * rate;
			const deduction = gross * 0.05; // Adjust if needed
			const net = gross - deduction;

			const message = `Kertai Choronok Milk Center
Week ${sundayStr} To ${todayStr}
${breakdown.trim()}
Total: ${totalQty}L
Rate: ${rate.toFixed(2)}
Gross: ${gross.toFixed(2)} KES
Deduction: ${deduction.toFixed(2)} KES
Net Pay: ${net.toFixed(2)} KES
Thank you ${name}!`;

			const smsResult = await sendSMS(phone, message);

			if (smsResult?.statusCode !== 100) {
				console.warn(`⚠️ SMS not delivered to ${phone}: ${smsResult.status}`);
			} else {
				console.log(`✅ SMS sent to ${phone}`);
			}
		}

		console.log("✅ Weekly SMS job completed.");
	} catch (error) {
		console.error("❌ Error in SMS job:", error.message || error);
	}
});

/** @format 

const cron = require("node-cron");
const { sql, dbConfig } = require("../models/db");
const sendSMS = require("../utilis/africasTalkingSMS");

// Run daily at 6 PM
cron.schedule("* * * * *", async () => {
	console.log("🕕 Running daily supplier SMS job...");

	try {
		const pool = await sql.connect(dbConfig);

		const today = new Date();
		const weekStart = new Date(today);
		weekStart.setDate(today.getDate() - today.getDay()); // Sunday as week start
		const weekStartDate = weekStart.toISOString().split("T")[0]; // format: YYYY-MM-DD

		const result = await pool.request().query(`
      SELECT 
        s.id AS supplierId,
        s.name,
        s.contact AS phoneNumber,
        SUM(p.quantity) AS dailyQuantity
      FROM Purchases p
      JOIN Suppliers s ON p.supplier_id = s.id
      WHERE CAST(p.createdAt AS DATE) = CAST(GETDATE() AS DATE)
      GROUP BY s.id, s.name, s.contact
    `);

		if (result.recordset.length === 0) {
			console.log("📭 No deliveries recorded today.");
			return;
		}

		for (const row of result.recordset) {
			let { supplierId, name, phoneNumber, dailyQuantity } = row;
			phoneNumber = phoneNumber.trim();

			if (!phoneNumber.startsWith("+254")) {
				console.warn(`⚠️ Skipping invalid phone: ${phoneNumber}`);
				continue;
			}

			// ✅ Check if a record exists for this supplier for this week
			const existing = await pool
				.request()
				.input("supplierId", sql.Int, supplierId)
				.input("weekStart", sql.Date, weekStartDate).query(`
          SELECT * FROM WeeklyDeliveries 
          WHERE supplier_id = @supplierId AND week_start_date = @weekStart
        `);

			if (existing.recordset.length === 0) {
				// Insert new record
				await pool
					.request()
					.input("supplierId", sql.Int, supplierId)
					.input("weekStart", sql.Date, weekStartDate)
					.input("dailyQuantity", sql.Decimal(10, 2), dailyQuantity).query(`
            INSERT INTO WeeklyDeliveries (supplier_id, week_start_date, total_quantity)
            VALUES (@supplierId, @weekStart, @dailyQuantity)
          `);
			} else {
				// Update existing
				await pool
					.request()
					.input("supplierId", sql.Int, supplierId)
					.input("weekStart", sql.Date, weekStartDate)
					.input("dailyQuantity", sql.Decimal(10, 2), dailyQuantity).query(`
            UPDATE WeeklyDeliveries 
            SET total_quantity = total_quantity + @dailyQuantity
            WHERE supplier_id = @supplierId AND week_start_date = @weekStart
          `);
			}

			// ✅ Fetch updated weekly total
			const { total_quantity } = (
				await pool
					.request()
					.input("supplierId", sql.Int, supplierId)
					.input("weekStart", sql.Date, weekStartDate).query(`
            SELECT total_quantity FROM WeeklyDeliveries
            WHERE supplier_id = @supplierId AND week_start_date = @weekStart
          `)
			).recordset[0];

			// ✅ Friendly message
			const message = `Hello ${name}, thank you for your delivery today of ${dailyQuantity} litres. So far this week, you've delivered ${total_quantity} litres. Keep it up!`;

			const smsResult = await sendSMS(phoneNumber, message);

			if (smsResult?.statusCode !== 100) {
				console.warn(
					`⚠️ SMS not delivered to ${phoneNumber}: ${smsResult?.status}`
				);
			}
		}

		console.log("✅ Daily SMS job completed.");
	} catch (error) {
		console.error("❌ Error in SMS job:", error.message || error);
	}
});*/
