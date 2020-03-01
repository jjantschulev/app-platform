const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const renderPage = require("./util/renderPage");

const { router: authRouter, isAuthenticated } = require('./auth');
const domainRouter = require('./domains');

app.use((req, res, next) => {
	// if(console.log(req.cookies));
	next();
});
app.use('/static/', express.static(path.join(__dirname, 'static')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/auth/', authRouter);
app.use('/domains/', domainRouter);

app.get("/", isAuthenticated, (req, res) => {
	res.send(renderPage('main'));
});

app.listen(31413);
