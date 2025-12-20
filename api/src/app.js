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
app.get(['/admin', '/admin/login', '/admin/login.html'], (req, res) => {
  return res.sendFile(path.join(adminPath, 'login.html'));
});
app.use('/admin/assets', express.static(path.join(adminPath, 'assets')));



// admin root: cookie varsa dashboard'a, yoksa login'e
app.get('/admin', requireAuthPage, (req, res) =>
  res.sendFile(path.join(adminPath, 'dashboard.html'))
);
app.use('/admin', requireAuthPage, express.static(adminPath));

//app.use('/admin', express.static(adminPath));

// İstersen /admin'e girince otomatik login açsın:
app.get('/admin', (req, res) => {
  res.sendFile(path.join(adminPath, 'login.html'));
});

app.use(express.json());

app.use('/api', routes);

module.exports = app;
