/** @format */
const express = require("express");
const PDFDocument = require("pdfkit");
const { poolPromise, sql } = require("../models/db");
const { authenticateUser } = require("../middlewares/authMiddleware");

const router = express.Router();

// ✅ Generate date filter SQL query (NEW)
const getDateFilterQuery = (filter, column) => {
	let condition = "";

	switch (filter) {
		case "day":
			condition = `CONVERT(DATE, ${column}) = CONVERT(DATE, GETDATE())`;
			break;
		case "previous-week":
			condition = `DATEPART(WEEK, ${column}) = DATEPART(WEEK, DATEADD(WEEK, -1, GETDATE())) AND YEAR(${column}) = YEAR(DATEADD(WEEK, -1, GETDATE()))`;
			break;
		case "week":
			condition = `DATEPART(WEEK, ${column}) = DATEPART(WEEK, GETDATE()) AND YEAR(${column}) = YEAR(GETDATE())`;
			break;
		case "month":
			condition = `MONTH(${column}) = MONTH(GETDATE()) AND YEAR(${column}) = YEAR(GETDATE())`;
			break;
		case "year":
			condition = `YEAR(${column}) = YEAR(GETDATE())`;
			break;
		default:
			condition = ""; // ✅ Return empty string if no filter
	}

	// ✅ Only add WHERE if condition is not empty
	return condition ? `AND ${condition}` : "";
};

const generatePDF = (companyName, title, headers, data, summary, res) => {
	const doc = new PDFDocument({ margin: 50 });

	res.setHeader("Content-Disposition", `attachment; filename=${title}.pdf`);
	res.setHeader("Content-Type", "application/pdf");
	doc.pipe(res);

	// **Branding & Title**
	doc
		.fontSize(22)
		.font("Helvetica-Bold")
		.text(companyName, { align: "center" })
		.moveDown(0.3);
	doc.fontSize(16).text(title, { align: "center" }).moveDown(0.3);
	doc
		.fontSize(10)
		.text(`Generated on: ${new Date().toLocaleString()}`, { align: "center" })
		.moveDown(1);

	// **Table Setup**
	const colWidths = [50, 150, 80, 100, 100, 80, 80, 100]; // Adjust column widths
	const startX = 50;
	let posY = doc.y;

	// Function to draw table headers
	const drawTableHeaders = () => {
		doc
			.fillColor("#FFFFFF")
			.rect(
				startX,
				posY,
				colWidths.reduce((a, b) => a + b, 0),
				25
			)
			.fill("#3160bf"); // Header Background
		doc.fillColor("black").font("Helvetica-Bold").fontSize(12);
		headers.forEach((header, index) => {
			doc.text(
				header,
				startX + colWidths.slice(0, index).reduce((a, b) => a + b, 0),
				posY + 7,
				{
					width: colWidths[index],
					align: "center",
				}
			);
		});
		posY += 30;
		doc.fillColor("black").font("Helvetica").fontSize(10);
	};

	// Draw headers for the first page
	drawTableHeaders();

	// Function to check if we need a new page
	const checkNewPage = () => {
		if (posY + 30 > doc.page.height - 50) {
			doc.addPage();
			posY = 50; // Reset Y position for the new page
			drawTableHeaders(); // Reprint table headers
		}
	};

	// **Draw Table Data with Alternating Row Colors**
	data.forEach((row, rowIndex) => {
		checkNewPage(); // Check if we need a new page before adding a row

		doc
			.fillColor(rowIndex % 2 === 0 ? "#f5f5f5" : "#ffffff")
			.rect(
				startX,
				posY,
				colWidths.reduce((a, b) => a + b, 0),
				20
			)
			.fill();
		doc.fillColor("black");

		Object.values(row).forEach((value, index) => {
			doc.text(
				value.toString(),
				startX + colWidths.slice(0, index).reduce((a, b) => a + b, 0),
				posY + 5,
				{
					width: colWidths[index],
					align: "center",
				}
			);
		});
		posY += 25;
	});

	// **Enhanced Summary Section (Only on Last Page)**
	checkNewPage();
	if (summary.length) {
		doc.moveDown(1);

		// ✅ Enhanced Summary Title with Styling
		doc
			.moveDown(1)
			.fontSize(16) // Larger font for emphasis
			.font("Helvetica-Bold")
			.fillColor("#ffffff") // White text for contrast
			.text("SUMMARY", { align: "center" })
			.moveDown(0.2);

		// ✅ Background Bar for Better Visibility
		const titleHeight = 22;
		const titleWidth = 500;
		const titleStartX = 50;
		const titleStartY = doc.y - titleHeight - 5; // Adjusted Y position

		doc
			.rect(titleStartX, titleStartY, titleWidth, titleHeight) // Background box
			.fill("#004080") // Deep blue background
			.stroke("#002f5e") // Darker blue border for a professional look
			.moveDown(0.5);

		// ✅ Rewriting the title after background for visibility
		doc
			.fillColor("#ffffff") // White text
			.fontSize(14)
			.font("Helvetica-Bold")
			.text("SUMMARY", titleStartX, titleStartY + 6, {
				align: "center",
				width: titleWidth,
			})
			.moveDown(0.5);

		// ✅ Line separator
		doc
			.strokeColor("#cccccc")
			.lineWidth(1)
			.moveTo(50, doc.y)
			.lineTo(550, doc.y)
			.stroke()
			.moveDown(0.5);

		// ✅ Summary Box with Background
		const boxStartY = doc.y;
		const boxHeight = summary.length * 20 + 10; // Adjust height dynamically

		doc
			.rect(50, boxStartY, 500, boxHeight)
			.fill("#f8f8f8") // Light grey background
			.stroke("#dddddd") // Border color
			.moveDown(0.5);

		// ✅ Draw Summary Table Headers
		let posY = boxStartY + 5;
		doc
			.fontSize(11)
			.fillColor("#000000")
			.text("Category", 55, posY, { width: 250, align: "left", bold: true })
			.text("Value", 320, posY, { width: 200, align: "right", bold: true });

		posY += 15;

		// ✅ Draw Summary Data Rows
		summary.forEach((item, index) => {
			doc
				.fontSize(10)
				.fillColor(index % 2 === 0 ? "#333333" : "#555555") // Alternate row colors
				.text(item.label, 55, posY, { width: 250, align: "left" })
				.text(item.value.toString(), 320, posY, { width: 200, align: "right" });

			posY += 15;
		});

		doc.moveDown(1);
	}

	// **Footer Section (Only on Last Page)**
	doc
		.strokeColor("#cccccc")
		.lineWidth(1)
		.moveTo(50, doc.y)
		.lineTo(550, doc.y)
		.stroke()
		.moveDown(1.5);

	doc
		.fontSize(10)
		.fillColor("#666666")
		.text("Generated by: KevTech System", { align: "left" })
		.text("© 2025. KevTech System ", { align: "left" })
		.text("This is a system-generated report.\n No manual changes were made.", {
			align: "left",
		})
		.moveDown(1.5);

	doc.end();
};

// Route to generate different reports
router.get("/:type", authenticateUser, async (req, res) => {
	try {
		// ✅ Ensure `req.user` is available
		if (!req.user || !req.user.company_id) {
			console.error("❌ No company_id found in req.user:", req.user);
			return res
				.status(403)
				.json({ error: "Unauthorized access. No company ID found." });
		}

		const { type } = req.params;
		const { filter, format } = req.query;
		const companyId = req.user.company_id;
		console.log(
			`🔍 Generating ${
				/*req.params.*/ type
			} report for company ID: ${companyId}, Format: ${format}`
		);

		const pool = await poolPromise;

		// ✅ Fetch company name
		const companyResult = await pool
			.request()
			.input("company_id", sql.Int, companyId)
			.query("SELECT name FROM Companies WHERE id = @company_id");

		if (!companyResult.recordset.length) {
			return res.status(404).json({ error: "Company not found" });
		}

		const companyName = companyResult.recordset[0].name; // ✅ Store company name

		let query = "",
			title = "",
			headers = [],
			summary = [];

		let dateColumn = type === "purchases" ? "purchase_date" : "sale_date";
		const dateFilter = getDateFilterQuery(filter, dateColumn);

		switch (type) {
			case "daily-report":
				query = `
    DECLARE @today DATE = CONVERT(DATE, GETDATE());

    -- Intake (purchases)
    SELECT 
        'Total Purchases (Intake)' AS type,
        ISNULL(SUM(p.quantity), 0) AS quantity,
        NULL AS customer,
        NULL AS total_price
    FROM Purchases p
    WHERE CONVERT(DATE, p.createdAt) = @today AND p.company_id = @company_id

    UNION ALL

    -- Total Sales (Liters)
    SELECT 
        'Total Sales (Liters)' AS type,
        ISNULL(SUM(s.quantity), 0),
        NULL,
        NULL
    FROM Sales s
    WHERE CONVERT(DATE, s.sale_date) = @today AND s.company_id = @company_id

    UNION ALL

    -- Sales to Brookside
    SELECT 
        'Sales to Brookside' AS type,
        ISNULL(SUM(s.quantity), 0),
        'Brookside',
        ISNULL(SUM(s.total_price), 0)
    FROM Sales s
    WHERE CONVERT(DATE, s.sale_date) = @today AND s.customer = 'Brookside' AND s.company_id = @company_id

    UNION ALL

    -- Sales to Local Customers
    SELECT 
        'Sales to Local Customers' AS type,
        ISNULL(SUM(s.quantity), 0),
        'Local Sales',
        ISNULL(SUM(s.total_price), 0)
    FROM Sales s
    WHERE CONVERT(DATE, s.sale_date) = @today AND s.customer = 'Local' AND s.company_id = @company_id

    UNION ALL

    -- Sales to Mulot/Other Customers
    SELECT 
        'Sales to Mulot/Other' AS type,
        ISNULL(SUM(s.quantity), 0),
        'Mulot/Other',
        ISNULL(SUM(s.total_price), 0)
    FROM Sales s
    WHERE CONVERT(DATE, s.sale_date) = @today AND s.customer NOT IN ('Brookside', 'Local') AND s.company_id = @company_id

    UNION ALL

    -- Variance ( Total Sales - Intake )
    SELECT 
        'Variance (Sales - Intake)' AS type,
        ISNULL((SELECT SUM(s.quantity) FROM Sales s 
                WHERE CONVERT(DATE, s.sale_date) = @today AND s.company_id = @company_id), 0)
        - ISNULL((SELECT SUM(p.quantity) FROM Purchases p 
                  WHERE CONVERT(DATE, p.createdAt) = @today AND p.company_id = @company_id), 0),
        NULL,
        NULL

    UNION ALL

    -- Cumulative Sales Total
    SELECT 
        'Cumulative Sales Total' AS type,
        NULL,
        NULL,
        ISNULL(SUM(s.total_price), 0)
    FROM Sales s
    WHERE CONVERT(DATE, s.sale_date) = @today AND s.company_id = @company_id
    `;

				title = "Daily Milk Summary Report";
				headers = ["Type", "Quantity (Liters)", "Customer", "Total (KES)"];
				break;

			case "sales":
				query = `
		SELECT 
			id, 
			customer, 
			product_name, 
			quantity, 
			total_price, 
			sale_date 
		FROM Sales 
		WHERE company_id = @company_id 
		${dateFilter} 
		ORDER BY sale_date DESC
	`;
				title = "Sales Report (By Customer)";
				headers = [
					"ID",
					"Customer Name",
					"Product Name",
					"Quantity",
					"Total Price",
					"Sale Date",
				];
				break;

			case "stock":
				query = `SELECT id, product_name, quantity, purchase_price, selling_price 
                         FROM Stock 
                         WHERE company_id = @company_id 
                         ORDER BY product_name`;
				title = "Stock & Prices Report";
				headers = [
					"ID",
					"Product Name",
					"Quantity",
					"Purchase Price",
					"Selling Price",
				];
				break;
			case "purchases":
				query = `SELECT id, product_name, quantity, purchase_price, total, status, return_quantity 
                         FROM Purchases
						 
                         WHERE company_id = @company_id 
                         ORDER BY id DESC`;
				title = "Purchases Report";
				headers = [
					"ID",
					"Product Name",
					"Quantity",
					"Purchase Price",
					"Total",
					"Status",
					"Returned Quantity",
				];
				break;
			/*case "suppliers":
				query = `
		SELECT 
			s.id, 
			s.name, 
			s.contact, 
			s.address, 
			ISNULL(SUM(p.quantity), 0) AS total_quantity,
			ISNULL(MAX(p.purchase_price), 0) AS purchase_price,
			ISNULL(SUM(p.total), 0) AS total_amount
		FROM Suppliers s
		LEFT JOIN Purchases p 
			ON s.id = p.supplier_id 
			AND p.company_id = @company_id
			${getDateFilterQuery(filter, "p.createdAt")}
		WHERE s.company_id = @company_id
		GROUP BY s.id, s.name, s.contact, s.address
		ORDER BY s.name
	`;
				title = "Suppliers/Farmers Report";
				headers = [
					"ID",
					"Name",
					"Contact",
					"Address",
					"Total Quantity",
					"Avg Price (KES/L)",
					"Total Amount (KES)",
				];
				break;*/

			case "suppliers":
				query = `
						SELECT 
							s.id, 
							s.name, 
							s.contact, 
							s.address AS Category, 
				
							-- Quantities per day (Sunday = 1, ..., Saturday = 7)
							ISNULL(SUM(CASE WHEN DATEPART(WEEKDAY, p.createdAt) = 1 THEN p.quantity ELSE 0 END), 0) AS D1,
							ISNULL(SUM(CASE WHEN DATEPART(WEEKDAY, p.createdAt) = 2 THEN p.quantity ELSE 0 END), 0) AS D2,
							ISNULL(SUM(CASE WHEN DATEPART(WEEKDAY, p.createdAt) = 3 THEN p.quantity ELSE 0 END), 0) AS D3,
							ISNULL(SUM(CASE WHEN DATEPART(WEEKDAY, p.createdAt) = 4 THEN p.quantity ELSE 0 END), 0) AS D4,
							ISNULL(SUM(CASE WHEN DATEPART(WEEKDAY, p.createdAt) = 5 THEN p.quantity ELSE 0 END), 0) AS D5,
							ISNULL(SUM(CASE WHEN DATEPART(WEEKDAY, p.createdAt) = 6 THEN p.quantity ELSE 0 END), 0) AS D6,
							ISNULL(SUM(CASE WHEN DATEPART(WEEKDAY, p.createdAt) = 7 THEN p.quantity ELSE 0 END), 0) AS D7,
				
							ISNULL(SUM(p.quantity), 0) AS totals,
							ISNULL(MAX(p.purchase_price), 0) AS Rate,
							ISNULL(SUM(p.total), 0) AS total_amount
				
						FROM Suppliers s
						LEFT JOIN Purchases p 
							ON s.id = p.supplier_id 
							AND p.company_id = @company_id
							${getDateFilterQuery(filter, "p.createdAt")}
						WHERE s.company_id = @company_id
						GROUP BY s.id, s.name, s.contact, s.address
						ORDER BY s.name
					`;

				title = "Suppliers/Farmers Report";
				headers = [
					"ID",
					"Name",
					"Contact",
					"Category",
					"D1 (Sun)",
					"D2 (Mon)",
					"D3 (Tue)",
					"D4 (Wed)",
					"D5 (Thu)",
					"D6 (Fri)",
					"D7 (Sat)",
					"Totals",
					"Rate (KES/L)",
					"Total Amount (KES)",
				];
				break;

			case "products":
				query =
					"SELECT id, name FROM Products WHERE company_id = @company_id ORDER BY name";
				title = "Products Report";
				headers = ["ID", "Name"];
				break;
			case "expenses":
				query = `SELECT id, category, amount, createdAt 
				 FROM Expenses 
				 WHERE company_id = @company_id 
				 ${dateFilter} 
				 ORDER BY createdAt DESC`;
				title = "Expenses Report";
				headers = ["ID", "Category", "Amount", "Date"];
				break;
			case "users":
				query =
					"SELECT id, username, role FROM Users WHERE company_id = @company_id ORDER BY username";
				title = "Users Report";
				headers = ["ID", "Username", "Role"];
				break;
			default:
				return res.status(400).json({ error: "Invalid report type" });
		}

		const result = await pool
			.request()
			.input("company_id", sql.Int, companyId)
			.query(query);
		//const result = await pool.request().query(query);
		if (!result.recordset.length) {
			return res.status(404).json({ error: "No data found" });
		}

		// **Calculate Summary**
		if (type === "stock") {
			const totalStockValue = result.recordset.reduce(
				(sum, row) => sum + row.selling_price * row.quantity,
				0
			);
			summary = [
				{ label: "Total Products", value: result.recordset.length },
				{
					label: "Total Stock Value",
					value: `KES ${totalStockValue.toFixed(2)}`,
				},
			];
		}
		if (type === "purchases") {
			const totalPurchaseValue = result.recordset.reduce(
				(sum, row) => sum + row.purchase_price * row.quantity,
				0
			);
			const totalPaid = result.recordset.filter(
				(row) => row.status === "Paid"
			).length;
			const totalUnpaid = result.recordset.length - totalPaid;

			summary = [
				{ label: "Total Purchases", value: result.recordset.length },
				{ label: "Total Paid Purchases", value: totalPaid },
				{ label: "Total Unpaid Purchases", value: totalUnpaid },
				{
					label: "Total Purchase Value",
					value: `KES ${totalPurchaseValue.toFixed(2)}`,
				},
			];
		}

		if (type === "sales") {
			const totalSalesValue = result.recordset.reduce(
				(sum, row) => sum + row.total_price,
				0
			);
			summary = [
				{ label: "Total Products", value: result.recordset.length },
				{
					label: "Total Sales Made",
					value: `KES ${totalSalesValue.toFixed(2)}`,
				},
			];
		}

		if (type === "products") {
			const totalProductsValue = result.recordset.reduce(
				(sum, row) => sum + row.total_price,
				0
			);
			summary = [
				{ label: "Total Products", value: result.recordset.length },
				//{
				//label: "Total Sales Made",
				//value: `KES ${totalProductsValue.toFixed(2)}`,
				//},
			];
		}

		if (type === "suppliers") {
			const totalProductsValue = result.recordset.reduce(
				(sum, row) => sum + row.total_price,
				0
			);
			summary = [
				{ label: "Total Suppliers", value: result.recordset.length },
				//{
				//label: "Total Sales Made",
				//value: `KES ${totalProductsValue.toFixed(2)}`,
				//},
			];
		}

		if (type === "daily-report") {
			const purchaseQty =
				result.recordset.find((r) => r.type === "Total Purchases (Intake)")
					?.quantity || 0;

			const salesQty =
				result.recordset.find((r) => r.type === "Total Sales (Liters)")
					?.quantity || 0;

			const brooksideSales =
				result.recordset.find((r) => r.type === "Sales to Brookside")
					?.total_price || 0;

			const localSales =
				result.recordset.find((r) => r.type === "Sales to Local Customers")
					?.total_price || 0;

			const cumulativeSales = brooksideSales + localSales;

			const variance = salesQty - purchaseQty; // matches SQL calculation

			summary = [
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
		}

		if (type === "expenses") {
			const totalExpenseValue = result.recordset.reduce(
				(sum, row) => sum + row.amount,
				0
			);
			summary = [
				{ label: "Total Expenses", value: result.recordset.length },
				{
					label: "Total Expense Amount",
					value: `KES ${totalExpenseValue.toFixed(2)}`,
				},
			];
		}

		if (type === "users") {
			const totalProductsValue = result.recordset.reduce(
				(sum, row) => sum + row.total_price,
				0
			);
			summary = [
				{ label: "Total System Users", value: result.recordset.length },
				//{
				//label: "Total Sales Made",
				//value: `KES ${totalProductsValue.toFixed(2)}`,
				//},
			];
		}

		// ✅ Check if the request is for Excel
		if (format === "excel") {
			console.log("✅ Sending JSON data for Excel export");
			return res.json(result.recordset); // ✅ Send JSON for Excel
		}

		// ✅ Generate PDF by default
		generatePDF(companyName, title, headers, result.recordset, summary, res);
	} catch (error) {
		console.error("❌ Error generating PDF report:", error.stack);
		res.status(500).json({ error: "Server error", details: error.message });
	}
});

module.exports = { router, generatePDF };
