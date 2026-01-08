const express = require('express');
const cookieParser = require('cookie-parser');
const requireAuthPage = require('./middleware/requireAuthPage');

const routes = require('./routes');
const cors = require('cors');
const path = require('path');

const app = express();
// CORS ayarları: Local ve production domain'leri
const allowedOrigins = [
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'http://localhost:4000',
  'https://envanter360.vercel.app',
  // Preview deployments için de ekle (Vercel otomatik preview URL'leri oluşturur)
  ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : [])
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Same-origin istekler (örneğin aynı domain'den) veya origin yoksa (Postman gibi) izin ver
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // Production'da sadece log, development'ta hata göster
        if (process.env.NODE_ENV === 'production') {
          console.warn('⚠️ CORS blocked origin:', origin);
        }
        callback(new Error('CORS policy violation'));
      }
    },
    credentials: true, // fetch içinde credentials: 'include' kullanıyorsun
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
const projectRoot = path.resolve(__dirname, '..','..'); // ✅ köke çık
const adminPath = path.join(projectRoot, 'admin');
app.use(cookieParser());

// Root path için basit yönlendirme / bilgi mesajı
// Vercel'de "Cannot GET /" almamak için
app.get('/', (req, res) => {
  // İstersen burada admin login'e yönlendirebilirsin
  return res.redirect('/admin/login');
});

// Eğer Vercel tüm istekleri /api'ye rewrite ediyorsa,
// /api için de basit bir cevap verelim
app.get('/api', (req, res) => {
  return res.json({ status: 'ok', message: 'API çalışıyor' });
});

// Assets klasörü herkese açık (CSS, JS, resimler vb.)
app.use('/admin/assets', express.static(path.join(adminPath, 'assets')));

// Login sayfası herkese açık
app.get(['/admin/login', '/admin/login.html'], (req, res) => {
  return res.sendFile(path.join(adminPath, 'login.html'));
});

// Admin root: cookie varsa dashboard'a, yoksa login'e yönlendir
app.get('/admin', (req, res) => {
  const token = req.cookies?.token;
  if (token) {
    try {
      const jwt = require('jsonwebtoken');
      jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key');
      return res.sendFile(path.join(adminPath, 'dashboard.html'));
    } catch (err) {
      return res.sendFile(path.join(adminPath, 'login.html'));
    }
  }
  return res.sendFile(path.join(adminPath, 'login.html'));
});

// Diğer tüm admin sayfaları için authentication gerekli
app.use('/admin', requireAuthPage, express.static(adminPath));

app.use(express.json());

app.use('/api', routes);

module.exports = app;
