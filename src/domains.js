const express = require('express');
const router = express.Router();
const renderPage = require("./util/renderPage");
const db = require('./util/database');
const { isAuthenticated } = require('./auth');

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
		db.get('domains').push(body).write();
		res.redirect('/domains');
	} catch (error) {
		res.send(renderPage('domains/new', { body, error: error.message }));
	}
});

router.get('/edit/:domain', isAuthenticated, (req, res) => {
	const body = db.get('domains').find({ domain: req.params.domain }).value();
	if (body) {
		res.send(renderPage('domains/edit', { body }))
	} else {
		res.redirect('/domains');
	}
});

router.post('/edit/:domain', isAuthenticated, (req, res) => {
	const body = req.body;
	try {
		console.log(body);
		res.redirect('/domains');
	} catch (error) {
		res.send(renderPage('domains/edit', { body, error: error.message }));
	}
});

router.post('/delete/:domain', isAuthenticated, (req, res) => {
	const body = db.get('domains').find({ domain: req.params.domain }).value();
	if (body) {
		db.get('domains').remove({ domain: body.domain }).write();
	}
	res.redirect('/domains');
});

module.exports = router;
