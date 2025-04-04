/** @format */
import React, { useEffect, useState } from "react";
import {
	Typography,
	Button,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	CircularProgress,
	Box,
	Alert,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import * as XLSX from "xlsx";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import API_BASE_URL from "../config";

const ReportsPage = () => {
	const [reportType, setReportType] = useState("sales");
	const [data, setData] = useState([]);
	const [error, setError] = useState([]);
	const [loading, setLoading] = useState(false);
	const [filter, setFilter] = useState(""); // ✅ New filter state

	useEffect(() => {
		fetchReport();
	}, [reportType, filter]); // ✅ Added filter dependency

	const fetchReport = async () => {
		setLoading(true);
		//setError("");
		try {
			const token = localStorage.getItem("token");
			if (!token) {
				alert("Session expired. Please log in again.");
				setData([]);
				setLoading(false);
				return;
			}

			const url = `${API_BASE_URL}/api/reports/${reportType}?filter=${filter}&format=excel`;
			console.log("🔍 Fetching report from:", url);

			const response = await fetch(url, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				throw new Error(`Server error: ${response.status}`);
			}

			const result = await response.json();
			console.log("✅ API Response Data:", result);

			if (!result || result.length === 0) {
				setError("⚠️ No data found for this report.");
				setData([]);
				return;
			}

			setData(result);
		} catch (error) {
			console.error("❌ Error fetching report:", error);
			setError(error.message || "❌ Failed to load report.");
			setData([]);
		} finally {
			setLoading(false);
		}
	};

	// ✅ Updated download functions to include filters
	const downloadPDF = async () => {
		const token = localStorage.getItem("token");
		if (!token) {
			alert("⚠️ Session expired. Please log in again.");
			return;
		}

		const url = `${API_BASE_URL}/api/reports/${reportType}?filter=${filter}`;

		console.log("🔍 Downloading PDF from:", url);

		try {
			const response = await fetch(url, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			console.log("📌 Response Status:", response.status);

			if (!response.ok) {
				throw new Error(`Server error: ${response.status}`);
			}

			const blob = await response.blob();
			const pdfUrl = URL.createObjectURL(blob);

			console.log("✅ PDF URL:", pdfUrl);

			// Open PDF
			window.open(pdfUrl, "_blank");
		} catch (error) {
			console.error("❌ Error downloading PDF:", error);
			alert("⚠️ No Report Data Available to download.");
		}
	};

	const exportToExcel = async () => {
		console.log("🔍 Fetching data for Excel export...");

		const token = localStorage.getItem("token");
		if (!token) {
			alert("❌ Session expired. Please log in again.");
			return;
		}

		const url = `${API_BASE_URL}/api/reports/${reportType}?filter=${filter}&format=excel`;
		console.log("🔍 Fetching Excel report from:", url);

		try {
			const response = await fetch(url, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				throw new Error(`Server error: ${response.status}`);
			}

			const result = await response.json();
			console.log("✅ Data received for Excel export:", result);

			if (!result || result.length === 0) {
				alert("⚠️ No data available for export.");
				return;
			}

			// Convert data to Excel
			const worksheet = XLSX.utils.json_to_sheet(result);
			const workbook = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(workbook, worksheet, `${reportType}_Report`);

			XLSX.writeFile(workbook, `${reportType}_report.xlsx`);
			console.log("✅ Excel file downloaded successfully!");
		} catch (error) {
			console.error("❌ Error exporting to Excel:", error);
			alert("⚠️ No data available for export.");
		}
	};

	return (
		<Box sx={{ p: 4 }}>
			<Typography variant='h4' gutterBottom>
				Download Reports
			</Typography>

			{/* Report Type Selector */}
			<Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
				{[
					"sales",
					"products",
					"purchases",
					"expenses",
					"stock",
					"suppliers",
					"users",
				].map((type) => (
					<Button
						key={type}
						variant={reportType === type ? "contained" : "outlined"}
						onClick={() => setReportType(type)}
					>
						{type.charAt(0).toUpperCase() + type.slice(1)}
					</Button>
				))}
			</Box>
			{/* ✅ Filter Selector */}
			<Typography variant='h6' sx={{ mt: 2, mb: 1 }}>
				Filter by:
			</Typography>
			<Box sx={{ display: "flex", gap: 2, mb: 3 }}>
				{["", "day", "week", "month", "year"].map((f) => (
					<Button
						key={f}
						variant={filter === f ? "contained" : "outlined"}
						onClick={() => setFilter(f)}
					>
						{f ? f.charAt(0).toUpperCase() + f.slice(1) : "All"}
					</Button>
				))}
			</Box>
			{/* Report Table */}
			{loading ? (
				<CircularProgress />
			) : (
				<TableContainer
					component={Paper}
					sx={{ boxShadow: 3, borderRadius: 2 }}
				>
					<Table>
						<TableHead>
							<TableRow sx={{ backgroundColor: "#1976d2" }}>
								{data.length > 0 &&
									Object.keys(data[0]).map((key) => (
										<TableCell
											key={key}
											sx={{ color: "#fff", fontWeight: "bold" }}
										>
											{key.toUpperCase()}
										</TableCell>
									))}
							</TableRow>
						</TableHead>
						<TableBody>
							{data.map((row, index) => (
								<TableRow
									key={index}
									sx={{ "&:nth-of-type(odd)": { backgroundColor: "#f4f4f4" } }}
								>
									{Object.values(row).map((value, idx) => (
										<TableCell key={idx}>{value}</TableCell>
									))}
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			)}

			{/* Download Buttons */}
			<Box sx={{ mt: 3, display: "flex", gap: 2 }}>
				<Button
					variant='contained'
					color='secondary'
					startIcon={<CloudDownloadIcon />}
					onClick={downloadPDF}
				>
					Download PDF Report
				</Button>
				<Button
					variant='contained'
					color='success'
					startIcon={<FileDownloadIcon />}
					onClick={exportToExcel}
				>
					Export to Excel
				</Button>
			</Box>
		</Box>
	);
};

export default ReportsPage;
