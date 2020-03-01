const fs = require('fs');
const path = require('path');
const fastplate = require("../../lib/fastplate");

function renderPage(templatePath, options = {}) {
	const filePath = templatePath.split('/');
	const templateName = filePath[filePath.length - 1] + '.html';
	const folders = filePath.slice(0, filePath.length - 1);
	const html = fs.readFileSync(path.join(__dirname, '..', 'views', ...folders, templateName), 'utf-8');
	const context = { ...options, load: (p, ...args) => renderPage(path.join(...folders, p), { args, context: options }) };
	return fastplate(html, context);
}

module.exports = renderPage;
