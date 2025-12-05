const express = require('express');
const cookieParser = require('cookie-parser');
const routes = require('./routes');
const cors = require('cors');

const app = express();
app.use(
  cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500'], // frontend nereden istek atıyorsa
    credentials: true, // fetch içinde credentials: 'include' kullanıyorsun
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());
app.use(cookieParser());

app.use('/api', routes);

module.exports = app;
