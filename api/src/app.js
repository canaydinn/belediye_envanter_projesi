const express = require('express');
const cookieParser = require('cookie-parser');
const requireAuthPage = require('./middleware/requireAuthPage');

const routes = require('./routes');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(
  cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500'], // frontend nereden istek atıyorsa
    credentials: true, // fetch içinde credentials: 'include' kullanıyorsun
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
const projectRoot = path.resolve(__dirname, '..','..'); // ✅ köke çık
const adminPath = path.join(projectRoot, 'admin');
app.use(cookieParser());

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
