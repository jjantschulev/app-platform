const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const db = require('./util/database');
const fastplate = require('../lib/fastplate');
const TEMPLATE_PATH = path.join(__dirname, './nginx-config/template.conf');
const CONFIG_DIR = "/etc/nginx/sites-available/"
const ENABLED_CONFIG_DIR = "/etc/nginx/sites-enabled/";
const { execSync, exec } = require('child_process');

async function updateNginxConfig() {
    try {
        await removeOldFiles()
        const template = await fsp.readFile(TEMPLATE_PATH, 'utf-8');
        const data = db.get('domains').value();
        let files = data.map(d => ({ name: d.domain + '.aps', body: fastplate(template, { ...d }) }));
        let promises = files.map(async (f) => {
            const fName = path.join(CONFIG_DIR, f.name);
            await fsp.writeFile(fName, f.body);
            await execPromise(`sudo ln -s ${fName} ${ENABLED_CONFIG_DIR}`);
        });
        await Promise.all(promises);
        await execPromise("sudo systemctl restart nginx");
    } catch (err) {
        console.log(err);
    }
}

function updateHttpsForAllDomains() {
    const data = db.get('domains').value();
    data.forEach(d => updateHttpsForDomain(d.domain));
}

async function updateHttpsForDomain(domain) {
    if (!testForCertbot()) return;
    const data = db.get('domains').find({ domain }).value();
    if (data.https) {
        try {
            await createCert(data.domain, data.email);
        } catch (err) {
            console.log(err);
        }
    }
}

function removeOldFiles() {
    return Promise.all([execPromise(`sudo rm -rf ${CONFIG_DIR}*.aps`), execPromise(`sudo rm -rf ${ENABLED_CONFIG_DIR}*.aps`)]);
}

function testForCertbot() {
    let result = "";
    try {
        result = execSync("command -v certbot").toString('utf-8');;
    } catch (e) {
        return false
    }
    if (result !== "/usr/bin/certbot\n") {
        return false
    } else {
        return true;
    }
}

async function createCert(domain, email) {
    const command = `sudo certbot certonly --webroot -d ${domain} -w /var/www/letsencrypt -m ${email} --noninteractive --no-eff-email --agree-tos --keep-until-expiring`;
    return execPromise(command);
}

function execPromise(command) {
    return new Promise((res, rej) => {
        exec(command, (err, output) => {
            if (err) rej(err);
            res(output);
        })
    });
}

setTimeout(() => updateHttpsForAllDomains, 864000000);

module.exports = { updateNginxConfig, updateHttpsForDomain };