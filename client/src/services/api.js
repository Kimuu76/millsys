/** @format */

import axios from "axios";

const API_URL = "http://localhost:5000"; // Change this if your backend URL is different

export const fetchSales = async () => {
	try {
		const response = await axios.get(`${API_URL}/sales`);
		return response.data;
	} catch (error) {
		console.error("Error fetching sales data", error);
		return [];
	}
};

export const fetchProducts = async () => {
	try {
		const response = await axios.get(`${API_URL}/products`);
		return response.data;
	} catch (error) {
		console.error("Error fetching products", error);
		return [];
	}
};
