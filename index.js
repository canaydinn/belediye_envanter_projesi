// Root path için serverless function
// Vercel'de / path'i için özel handling
require('dotenv').config();
const path = require('path');

const projectRoot = path.resolve(__dirname);
const adminPath = path.join(projectRoot, 'admin');

module.exports = (req, res) => {
  // Login sayfasını direkt serve et
  return res.sendFile(path.join(adminPath, 'login.html'));
};
