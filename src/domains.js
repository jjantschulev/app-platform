const express = require('express');
const router = express.Router();
const renderPage = require("./util/renderPage");
const db = require('./util/database');
const { isAuthenticated } = require('./auth');
const { updateNginxConfig, updateHttpsForDomain } = require("./nginx");

router.get('/', isAuthenticated, (req, res) => {
	res.send(renderPage('domains/domains', { domains: db.get('domains').value() }));
});

router.get("/new", isAuthenticated, (req, res) => {
	const body = {
		domain: '',
		https: true,
		email: process.env.EMAIL || '',
	}

	res.send(renderPage('domains/new', { body }));
});

router.post("/new", isAuthenticated, (req, res) => {
	const body = req.body;
	try {
		if (!body.domain) throw Error("Domain cannot be empty");
		if (db.get('domains').find({ domain: body.domain }).value()) {
			throw Error("Domain name already exists.")
		}
		const newDomain = {
			domain: body.domain,
			https: body.https,
			email: body.email,
			apps: [],
		}
		db.get('domains').push(newDomain).write();
		res.redirect('/app-platform/domains');
		if (body.https) {
			updateHttpsForDomain(body.domain).then(res => updateNginxConfig());
		} else {
			updateNginxConfig();
		}
	} catch (error) {
		res.send(renderPage('domains/new', { body, error: error.message }));
	}
});

router.get('/edit/:domain', isAuthenticated, (req, res) => {
	const body = db.get('domains').find({ domain: req.params.domain }).value();
	if (body) {
		res.send(renderPage('domains/edit', { body }))
	} else {
		res.redirect('/app-platform/domains');
	}
});

router.post('/edit/:domain', isAuthenticated, (req, res) => {
	const body = req.body;
	try {
		const currentHttps = db.get('domains')
			.find({ domain: req.params.domain })
			.get('https')
			.value();
		const newHttps = body.https === 'on';
		db.get('domains')
			.find({ domain: req.params.domain })
			.assign({ https: newHttps, email: body.email })
			.write();
		res.redirect('/app-platform/domains');
		if (currentHttps != newHttps && newHttps === true) {
			updateHttpsForDomain(req.params.domain).then(res => updateNginxConfig());
		} else {
			updateNginxConfig();
		}
	} catch (error) {
		res.send(renderPage('domains/edit', { body, error: error.message }));
	}
});

router.post('/delete/:domain', isAuthenticated, (req, res) => {
	const body = db.get('domains').find({ domain: req.params.domain }).value();
	if (body) {
		db.get('domains').remove({ domain: body.domain }).write();
		res.redirect('/app-platform/domains');
		updateNginxConfig();
	} else {
		res.redirect('/app-platform/domains');
	}
});

// APP Management

router.post('/:domain/apps/new', isAuthenticated, (req, res) => {
	let { name, uri, url } = req.body;
	if (uri[0] !== '/') uri = "/" + uri;
	if (uri[uri.length - 1] !== '/') uri = uri + "/";
	if (url[url.length - 1] !== '/') url = url + "/";
	db.get('domains').find({ domain: req.params.domain }).get('apps').push({ name, uri, url }).write();
	res.redirect("/app-platform/domains/edit/" + req.params.domain);
	updateNginxConfig();
});

router.post("/:domain/apps/delete/:name", isAuthenticated, (req, res) => {
	const { name, domain } = req.params;
	db.get('domains').find({ domain }).get('apps').remove({ name }).write();
	res.redirect("/app-platform/domains/edit/" + domain);
	updateNginxConfig();
});

router.post("/:domain/apps/edit/:name", isAuthenticated, (req, res) => {
	const { name: oldName, domain } = req.params;
	let { name, uri, url } = req.body;
	if (uri[0] !== '/') uri = "/" + uri;
	if (uri[uri.length - 1] !== '/') uri = uri + "/";
	if (url[url.length - 1] !== '/') url = url + "/";
	db.get('domains').find({ domain }).get('apps').find({ name: oldName }).assign({ name, uri, url }).write();
	res.redirect("/app-platform/domains/edit/" + domain);
	updateNginxConfig();
});


module.exports = router;
