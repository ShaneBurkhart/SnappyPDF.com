const yaml = require('js-yaml');
const fs   = require('fs');

// Convert the routes.yaml file to a JS file so client can use it
const routes = yaml.load(fs.readFileSync("./config/routes.yaml", 'utf8'));

if (!fs.existsSync('./build')) fs.mkdirSync('./build');
fs.writeFileSync("./build/routes.json", JSON.stringify(routes))