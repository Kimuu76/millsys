/** @format */
import React, { useRef } from "react";
import { Button, Typography, Box, Paper, Divider } from "@mui/material";
import { jsPDF } from "jspdf";

const PurchaseReceipt = ({ purchase, user, onClose }) => {
	// ✅ Generate receipt string dynamically
	const receiptId = `REC-${Math.floor(100000 + Math.random() * 900000)}`;

	const receiptRef = useRef();

	if (!purchase) {
		return <p>Loading receipt...</p>;
	}

	// ✅ Format Receipt Text
	const receiptText = `
   *** PURCHASE RECEIPT ***

KERTAI MILK COOLER
Address: Bomet, Kertai
Contact: 0720369014
--------------------------------

Receipt ID: ${receiptId}   
--------------------------------
Farmer: ${purchase.supplier_name}
Contact: ${purchase.supplier_contact || "N/A"}
Location: ${purchase.supplier_address}
--------------------------------
Product: ${purchase.product_name}
Quantity: ${purchase.quantity} L

--------------------------------
Date: ${new Date(purchase.createdAt).toLocaleString()}
Status: ${purchase.status}
Served by: ${user?.username || "N/A"}
--------------------------------
Thanks and Welcome!

--------------------------------
`;

	// ✅ Save as PDF
	const handleSaveAsPDF = () => {
		const doc = new jsPDF({
			orientation: "portrait",
			unit: "mm",
			format: [58, 297], // 58mm width for thermal receipts
		});

		doc.setFont("Courier");
		doc.setFontSize(10);
		const lines = receiptText.split("\n");
		let y = 10;

		lines.forEach((line) => {
			doc.text(line, 5, y);
			y += 5;
		});

		doc.save(`Purchase_Receipt_${Date.now()}.pdf`);
	};

	// ✅ Print Receipt
	const handlePrint = () => {
		const printWindow = window.open("", "_blank");
		printWindow.document.write(`
        <html>
        <head>
            <title>Print Receipt</title>
            <style>
                @page { size: auto; margin: 0; }
                body { font-family: "Courier New", monospace; text-align: left; margin: 0; padding: 0; width: 58mm; }
                .receipt-container { width: 58mm; padding: 5px; }
                h2, p { margin: 2px 0; font-size: 12px; }
                .line { border-top: 1px dashed #000; margin: 5px 0; }
                .items { font-size: 10px; white-space: pre-wrap; }
                .total { font-weight: bold; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="receipt-container">
                <pre>${receiptText.trim()}</pre>
            </div>
            <script>
                window.onload = function() { 
                    setTimeout(() => {
                        window.print();
                        setTimeout(() => window.close(), 500);
                    }, 500);
                };
            </script>
        </body>
        </html>
    `);
		printWindow.document.close();
	};

	return (
		<Paper
			elevation={6}
			sx={{
				p: 2,
				width: "100%",
				textAlign: "center",
				backgroundColor: "#fff",
				borderRadius: 2,
			}}
		>
			<Box
				ref={receiptRef}
				sx={{ textAlign: "left", fontSize: "12px", fontFamily: "monospace" }}
			>
				<pre style={{ whiteSpace: "pre-wrap" }}>{receiptText}</pre>
			</Box>

			<Divider sx={{ my: 1, borderStyle: "dashed" }} />

			<Typography variant='body2'>
				<b>Thank You!</b>
			</Typography>

			<Box mt={2}>
				<Button variant='contained' color='primary' onClick={handlePrint}>
					Print Receipt
				</Button>
				<Button
					variant='contained'
					color='secondary'
					onClick={handleSaveAsPDF}
					sx={{ ml: 1 }}
				>
					Save as PDF
				</Button>
				<Button variant='outlined' onClick={onClose} sx={{ ml: 1 }}>
					Close
				</Button>
			</Box>
		</Paper>
	);
};

export default PurchaseReceipt;
