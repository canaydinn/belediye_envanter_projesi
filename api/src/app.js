const express = require('express');
const cookieParser = require('cookie-parser');
const routes = require('./routes');

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use('/api', routes);

module.exports = app;
