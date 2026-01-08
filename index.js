// Root path için serverless function
// Vercel'de / path'i için Express app'i kullan
require('dotenv').config();
const path = require('path');

// api/index.js'deki Express app'i kullan
const appPath = path.join(__dirname, 'api', 'src', 'app');
const app = require(appPath);

// Vercel serverless function olarak export et
module.exports = app;
