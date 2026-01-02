// Vercel Serverless Function entry point
// Bu dosya Express uygulamasını Vercel'e export eder
require('dotenv').config();
const app = require('./src/app');

// Vercel Serverless Function için export
module.exports = app;

