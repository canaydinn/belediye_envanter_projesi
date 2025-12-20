const express = require('express');
const cookieParser = require('cookie-parser');
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

console.log('PROJECT ROOT:', projectRoot);
console.log('ADMIN STATIC PATH:', adminPath);

app.use('/admin', express.static(adminPath));

// İstersen /admin'e girince otomatik login açsın:
app.get('/admin', (req, res) => {
  res.sendFile(path.join(adminPath, 'login.html'));
});

app.use(express.json());
app.use(cookieParser());

app.use('/api', routes);

module.exports = app;
