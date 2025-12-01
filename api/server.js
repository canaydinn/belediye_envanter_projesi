require('dotenv').config();
const path = require('path');

// Debug: Node hangi yola bakıyor, loglayalım
const appPath = path.join(__dirname, 'src', 'app.js');
console.log('App path:', appPath);

const app = require(appPath);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`API http://localhost:${PORT} üzerinde çalışıyor`);
});
