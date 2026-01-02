require('dotenv').config();
const path = require('path');

// Debug: Node hangi yola bakıyor, loglayalım
const appPath = path.join(__dirname, 'src', 'app.js');
console.log('App path:', appPath);

const app = require(appPath);

const PORT = process.env.PORT || 4000;

if (!PORT) {
  console.error('PORT environment variable is not set!');
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`API http://localhost:${PORT} üzerinde çalışıyor`);
});
