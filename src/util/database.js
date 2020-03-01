const low = require('lowdb');
const FileSync = require("lowdb/adapters/FileSync");
const path = require('path');

const adapter = new FileSync(path.join(__dirname, "..", "..", "data", "database.json"));
const db = low(adapter);

db.defaults({ domains: [], applications: [], sessions: [] }).write();

module.exports = db;