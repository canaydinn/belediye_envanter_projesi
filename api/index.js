// Vercel Serverless Function entry point
// Bu dosya Express uygulamasını Vercel'e export eder
require('dotenv').config();
const app = require('./src/app');

// Vercel Serverless Function için export
// Vercel Express app'i otomatik olarak handle eder
// Hem app hem de handler formatını destekler
module.exports = app;

