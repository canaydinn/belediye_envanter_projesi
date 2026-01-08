// Vercel Serverless Function entry point
// Bu dosya Express uygulamasını Vercel'e export eder
require('dotenv').config();
const path = require('path');

// Vercel serverless ortamında path çözümlemesi için __dirname kullan
// require() modül çözümlemesi yapar, .js uzantısı gerekmez
const app = require('../src/app');

// Vercel Serverless Function için export
// Vercel Express app'i otomatik olarak handle eder
module.exports = app;

