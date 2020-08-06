const express = require("express");
const axios = require("axios").default;
const jwt = require("jsonwebtoken");
const router = express.Router();

router.get("/token", (req, res) => {
	const { token, maxAge } = req.query;
	res.cookie('token', token, {
		maxAge: parseInt(maxAge, 10),
		sameSite: true,
		httpOnly: true,
		secure: true,
		path: "/app-platform/",
	});
	res.redirect("/app-platform/");
});


async function isAuthenticated(req, res, next) {
	const headerToken = req.headers["x-auth-token"];
	const userToken = req.cookies.token;
	if (headerToken) {
		try {
			const { data } = await axios.post("https://idp.ausjan.com/api/verify-token-access/", {
				clientId: process.env.CLIENT_ID,
				clientSecret: process.env.CLIENT_SECRET,
				token: headerToken,
			});
			req.accessScopes = data.scopes;
			req.user = data.user
			next();
		} catch (error) {
			const { data } = await axios.get("https://idp.ausjan.com/api/unauthorized");
			res.send(data);
		}
	} else {
		try {
			let decoded;
			try {
				decoded = jwt.verify(userToken, process.env.CLIENT_SECRET);
			} catch (error) {
				throw "jwt-error";
			}
			req.user = decoded;
			const { data } = await axios.post("https://idp.ausjan.com/api/verify-user-access/", {
				clientId: process.env.CLIENT_ID,
				clientSecret: process.env.CLIENT_SECRET,
				userId: decoded.id,
			});
			req.accessScopes = data.scopes;
			next();
		} catch (error) {
			if (error === "jwt-error") {
				res.redirect(`https://idp.ausjan.com/api/get-id-token?client_id=${process.env.CLIENT_ID}`)
			} else {
				const { data } = await axios.get("https://idp.ausjan.com/api/unauthorized");
				res.send(data);
			}
		}
	}
}


module.exports = { router, isAuthenticated };
