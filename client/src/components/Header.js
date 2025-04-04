/** @format */

// Header.js
import React from "react";
import styled from "styled-components";

const HeaderContainer = styled.header`
	background: rgb(17, 64, 118);
	color: white;
	padding: 0.5px 2px;
	display: flex;
	justify-content: center;
	align-items: center;
	box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
`;

const Logo = styled.h1`
	font-size: 24px;
	font-weight: bold;
`;

const Nav = styled.nav`
	a {
		color: white;
		text-decoration: none;
		margin: 0 15px;
		font-size: 16px;
		&:hover {
			text-decoration: underline;
		}
	}
`;

const Header = () => {
	return (
		<HeaderContainer>
			<Logo display='flex' justify content='center'>
				Bar & Restaurant POS
			</Logo>
		</HeaderContainer>
	);
};

export default Header;
