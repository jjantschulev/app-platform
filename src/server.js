const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const renderPage = require("./util/renderPage");

const { router: authRouter, isAuthenticated } = require('./auth');
const domainRouter = require('./domains');
const appsRouter = require('./apps');

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/static/', express.static(path.join(__dirname, 'static')));
app.use('/auth/', authRouter);
app.use('/domains/', domainRouter);
app.use('/apps/', appsRouter);

app.get("/", isAuthenticated, (req, res) => {
	res.send(renderPage('main'));
});

app.listen(31413, () => console.log("app-platform running on port 31413"));
