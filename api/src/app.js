const express = require('express');
const cookieParser = require('cookie-parser');
const requireAuthPage = require('./middleware/requireAuthPage');

const routes = require('./routes');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');

const app = express();
app.set('trust proxy', 1);

// Security headers (Helmet)
// CSP is enabled in Report-Only mode first; tighten/enforce after observing reports.
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// Vercel preview deployments inject "vercel.live" feedback tooling (iframe + script).
// In Report-Only mode this can spam the console; allow it only for preview.
const isVercelPreview = process.env.VERCEL_ENV === 'preview';
const vercelLiveOrigins = ['https://vercel.live'];

// `upgrade-insecure-requests` is ignored in Report-Only policies.
// To avoid the console warning (and keep behavior safe), send it as a tiny *enforced*
// CSP header only on Vercel deployments (HTTPS).
const isVercelDeployment = !!process.env.VERCEL;
if (isVercelDeployment) {
  app.use(
    helmet.contentSecurityPolicy({
      reportOnly: false,
      useDefaults: false,
      directives: {
        upgradeInsecureRequests: [],
      },
    })
  );
}

app.use(
  helmet.contentSecurityPolicy({
    reportOnly: true,
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'self'"],
      frameSrc: ["'self'", ...(isVercelPreview ? vercelLiveOrigins : [])],
      imgSrc: ["'self'", 'data:', 'blob:'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      // NOTE: Some bundled vendor files in `admin/assets/vendor/**` use `eval()` for sourcemaps/UMD wrappers.
      // If you later enforce CSP, consider swapping those bundles to non-eval builds instead of allowing unsafe-eval.
      scriptSrc: ["'self'", "'unsafe-eval'", ...(isVercelPreview ? vercelLiveOrigins : [])],
      connectSrc: ["'self'", ...(isVercelPreview ? vercelLiveOrigins : [])],
    },
  })
);
// CORS ayarları: Local ve production domain'leri
// NOT: VERCEL_URL Vercel tarafından otomatik sağlanır, .env'de olması gerekmez
const allowedOrigins = [
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'https://envanter360.vercel.app',
  // Preview deployments için Vercel otomatik olarak VERCEL_URL environment variable'ını sağlar
  // Local development'ta bu değişken olmayabilir, bu yüzden optional olarak ekliyoruz
  ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : [])
];

// Vercel preview ve production URL'leri için pattern matching
const isVercelUrl = (origin) => {
  if (!origin) return false;
  // Tüm *.vercel.app domain'lerini kabul et
  return /^https:\/\/.*\.vercel\.app$/.test(origin);
};

app.use(
  cors({
    origin: function (origin, callback) {
      // Same-origin istekler (örneğin aynı domain'den) veya origin yoksa (Postman gibi) izin ver
      if (!origin || allowedOrigins.includes(origin) || isVercelUrl(origin)) {
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
app.use(express.json());

// Root path'i handle et - hem / hem de /api/ formatında
// Vercel'de / → /api/ rewrite edilir ama bazen çalışmayabilir
app.get(['/', '/api', '/api/'], (req, res) => {
  try {
    return res.sendFile(path.join(adminPath, 'login.html'));
  } catch (error) {
    console.error('Error serving login.html:', error);
    return res.status(500).send('Error loading login page');
  }
});

// API routes ÖNCE (çünkü /api/auth/* gibi endpoint'ler var)
// Bu route'lar /api/admin/* route'undan önce gelmeli
app.use('/api', routes);

// Assets klasörü herkese açık (CSS, JS, resimler vb.)
// Hem /admin/assets/* hem de /api/admin/assets/* path'lerini handle et
app.use(['/admin/assets', '/api/admin/assets'], express.static(path.join(adminPath, 'assets')));

// Root'tan servis edilen sayfalar (örn: / veya /login.html) "assets/..." şeklinde referans verdiği için
// /assets/* path'ini de statik olarak servis et (Vercel'de aksi halde 404 → HTML döner → MIME hataları).
app.use(['/assets', '/api/assets'], express.static(path.join(adminPath, 'assets')));

// Login sayfası herkese açık
// Hem /admin/login hem de /api/admin/login path'lerini handle et
app.get(['/admin/login', '/admin/login.html', '/api/admin/login', '/api/admin/login.html'], (req, res) => {
  return res.sendFile(path.join(adminPath, 'login.html'));
});

// Eski/kolay erişim: /login.html veya /login
app.get(['/login', '/login.html', '/api/login', '/api/login.html'], (req, res) => {
  return res.sendFile(path.join(adminPath, 'login.html'));
});

// Admin root: cookie varsa dashboard'a, yoksa login'e yönlendir
app.get(['/admin', '/api/admin'], (req, res) => {
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
// Bu route EN SONDA olmalı (çünkü geniş bir pattern)
// Hem /admin/* hem de /api/admin/* path'lerini handle et
app.use(['/admin', '/api/admin'], requireAuthPage, express.static(adminPath));

module.exports = app;
