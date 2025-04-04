/** @format */
import React, { useRef, useEffect, useState } from "react";
import { Button, Typography, Box, Paper, Divider } from "@mui/material";
import { jsPDF } from "jspdf";

const Receipt = ({ receipt, onClose }) => {
	const receiptRef = useRef();

	if (!receipt || !receipt.text) {
		return <p>Loading receipt...</p>;
	}

	// ✅ Function to Save as PDF
	const handleSaveAsPDF = () => {
		const doc = new jsPDF({
			orientation: "portrait",
			unit: "mm",
			format: [58, 297], // 58mm width for thermal receipts
		});

		// ✅ Set up receipt formatting
		doc.setFont("Courier");
		doc.setFontSize(10);
		const receiptLines = receipt.text.split("\n");
		let y = 10; // Initial y-position

		receiptLines.forEach((line) => {
			doc.text(line, 5, y); // Positioning text
			y += 5; // Move down for the next line
		});

		// ✅ Save as PDF
		doc.save(`Receipt_${Date.now()}.pdf`);
	};

	const handlePrint = () => {
		const printWindow = window.open("", "_blank");
		printWindow.document.write(`
        <html>
        <head>
            <title>Print Receipt</title>
            <style>
                @page { size: auto; margin: 0; } /* ✅ Dynamically set height */
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
                <pre>${receipt.text.trim()}</pre> <!-- ✅ Trim spaces to remove unnecessary blank areas -->
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
				<pre style={{ whiteSpace: "pre-wrap" }}>{receipt.text}</pre>
			</Box>

			<Divider sx={{ my: 1, borderStyle: "dashed" }} />

			<Typography variant='body2'>
				<b>Adios! Thank You</b>
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

export default Receipt;
