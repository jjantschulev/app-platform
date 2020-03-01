const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const renderPage = require("./util/renderPage");
const db = require('./util/database');

router.get('/', isNotAuthenticated, (req, res) => {
	res.send(renderPage('login'));
})

router.post('/', (req, res) => {
	try {
		const { username, password } = req.body;
		const passwordHash = crypto.pbkdf2Sync(password, Buffer.from(process.env.SALT), 10000, 32, 'sha256').toString('hex');
		if (username === process.env.USERNAME && passwordHash === process.env.PASSWORD_HASH) {
			const sessionId = crypto.randomBytes(32).toString('hex');
			const expiry = (new Date()).getTime() + 1000 * 60 * 30;
			db.get('sessions').push({ sessionId, expiry }).write();
			res.cookie('id', sessionId, { expire: expiry });
			res.redirect('/');
		} else {
			res.send(renderPage('login', { error: "Incorrect Username or Password" }));
		}
	} catch (error) {
		res.send(renderPage('login', { error: "An error has occurred" }));
	}
});

router.get('/logout/', isAuthenticated, (req, res) => {
	db.get('sessions').remove({ sessionId: req.sessionId }).write();
	res.redirect('/auth/');
});

function isAuthenticated(req, res, next) {
	if (authed(req)) {
		req.sessionId = req.cookies.id;
		next();
	} else {
		res.redirect('/auth/')
	}
}

function isNotAuthenticated(req, res, next) {
	if (!authed(req)) {
		next();
	} else {
		res.redirect('/')
	}
}

function authed(req) {
	const sessionId = req.cookies.id;
	if (!sessionId) return false;
	const session = db.get('sessions').find({ sessionId }).value();
	if (session && (new Date()).getTime() < session.expiry) {
		return true;
	} else {
		return false;
	}
}


module.exports = { router, isAuthenticated };
