const express = require('express');
const router = express.Router();
const renderPage = require("./util/renderPage");
const db = require('./util/database');
const { isAuthenticated } = require('./auth');

router.get('/', isAuthenticated, (req, res) => {
	const domains = db.get('domains').value();

	const apps = [];

	for (const domain of domains) {
		for (const app of domain.apps) {
			if (app.url.startsWith('http://localhost:') || app.url.startsWith('http://127.0.0.1:')) {
				let i = app.url.lastIndexOf(":");
				let port = parseInt(app.url.slice(i + 1, app.url.length - 1), 10);
				let error = false;
				for (let a of apps) {
					if (a.port === port) {
						a.error = true;
						error = true;
					}
				}
				apps.push({
					...app,
					domain,
					port,
					error,
				})
			}
		}
	}

	apps.sort((a, b) => a.port - b.port);

	res.send(renderPage('apps/apps', { apps }));
});


module.exports = router;
