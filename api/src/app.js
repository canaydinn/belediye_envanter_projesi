// api/src/app.js
const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Burada senin routes/index.js'in varmış gibi varsayıyorum
const apiRouter = require('../routes'); // yoksa doğru path'e göre güncelle

const app = express();

app.use(cors({
  origin: 'http://localhost:4000', // geliştirirken front-back aynı origin, sorun çıkmaz
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// 1) API endpoint'leri
app.use('/api', apiRouter);

// 2) Vuexy admin panel statik dosyaları
// admin klasörü proje kökünde olduğundan:
app.use(express.static(path.join(__dirname, '..', '..', 'admin')));

// 3) Basit sağlık kontrolü (isteğe bağlı)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = app;
