/** @format */

// Footer.js
import React from "react";
import styled from "styled-components";

const FooterContainer = styled.footer`
	background: #002147;
	color: white;
	text-align: center;
	padding: 0.5px;
	position: fixed;
	bottom: 0;
	width: 100%;
`;

const Footer = () => {
	return (
		<FooterContainer>
			<p>&copy; 2025 | Developed by KevTech | Contact: +254712992577</p>
		</FooterContainer>
	);
};

export default Footer;
