import express from 'express';
import cors from 'cors';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { MenuController } from './controllers/MenuController';
import { OrderController, getPublicBaseUrl } from './controllers/OrderController';
import { AdminController } from './controllers/AdminController';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Confiar nos cabeçalhos de proxy reverso (Vercel / Cloudflare / Nginx)
app.set('trust proxy', 1);

// 1. Compressão Gzip/Deflate
app.use(compression());

// 2. Segurança Básica & Parsers
app.use(cors());
app.use(express.json({ limit: '512kb' }));
app.use(express.urlencoded({ extended: true, limit: '512kb' }));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// 3. Resolução resiliente de Views (EJS) para Local + Vercel Serverless (/var/task)
const candidateViewPaths = [
  path.join(__dirname, 'views'),
  path.join(__dirname, '../src/views'),
  path.join(process.cwd(), 'dist/views'),
  path.join(process.cwd(), 'src/views'),
];
const viewsPath = candidateViewPaths.find((p) => fs.existsSync(p)) || candidateViewPaths[0];
app.set('views', viewsPath);
app.set('view engine', 'ejs');

// 4. Resolução resiliente de ficheiros estáticos (public/)
const candidatePublicPaths = [
  path.join(__dirname, '../public'),
  path.join(process.cwd(), 'public'),
];
const publicPath = candidatePublicPaths.find((p) => fs.existsSync(p)) || candidatePublicPaths[0];

app.use(
  express.static(publicPath, {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
    etag: true,
    lastModified: true,
  })
);

// ================= ROTAS DE SEO TÉCNICO =================
app.get('/robots.txt', (req, res) => {
  const baseUrl = getPublicBaseUrl(req);
  res.type('text/plain');
  res.send(
    `User-agent: *\n` +
      `Allow: /\n` +
      `Disallow: /admin\n` +
      `Disallow: /api/\n` +
      `Sitemap: ${baseUrl}/sitemap.xml\n`
  );
});

app.get('/sitemap.xml', (req, res) => {
  const baseUrl = getPublicBaseUrl(req);
  res.type('application/xml');

  const pages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/menu', priority: '0.9', changefreq: 'daily' },
    { url: '/menu?category=paes', priority: '0.8', changefreq: 'weekly' },
    { url: '/menu?category=pastelaria', priority: '0.8', changefreq: 'weekly' },
    { url: '/menu?category=bolos', priority: '0.8', changefreq: 'weekly' },
    { url: '/menu?category=refeicoes', priority: '0.8', changefreq: 'weekly' },
    { url: '/menu?category=sorvetes', priority: '0.8', changefreq: 'weekly' },
    { url: '/menu?category=bebidas', priority: '0.8', changefreq: 'weekly' },
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  pages.forEach((p) => {
    xml += `  <url>\n    <loc>${baseUrl}${p.url}</loc>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>\n`;
  });
  xml += `</urlset>`;
  res.send(xml);
});

// ================= ROTAS PÚBLICAS (CLIENTE) =================
app.get('/', MenuController.getHome);
app.get('/menu', MenuController.getMenu);
app.get('/rastreio/:id', OrderController.getTrackingView);

// ================= ROTAS DE API (PEDIDOS, CATERING & PRODUTOS) =================
app.get('/api/products', MenuController.getProductsApi);
app.get('/api/products/:id', MenuController.getProductByIdApi);
app.get('/api/delivery-fee', OrderController.calculateFee);
app.post('/api/delivery/calculate', OrderController.calculateFee);
app.post('/api/orders', OrderController.createOrder);
app.get('/api/orders/:id', OrderController.getOrderApi);
app.post('/api/catering', OrderController.createCateringInquiry);
app.get('/api/locations', OrderController.getPembaNeighborhoodsApi);

// ================= PROTEÇÃO OPCIONAL DE PIN EM PRODUÇÃO (/admin) =================
function adminGuard(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const requiredPin = process.env.ADMIN_PIN;
  if (!requiredPin) {
    next();
    return;
  }

  const cookieHeader = req.headers.cookie || '';
  const hasValidCookie = cookieHeader.includes(`tb_admin_pin=${encodeURIComponent(requiredPin)}`);
  const providedPin = (req.query.pin as string) || (req.headers['x-admin-pin'] as string);

  if (providedPin === requiredPin) {
    res.setHeader(
      'Set-Cookie',
      `tb_admin_pin=${encodeURIComponent(requiredPin)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200`
    );
    next();
    return;
  }

  if (hasValidCookie) {
    next();
    return;
  }

  if (req.path.startsWith('/api/')) {
    res.status(401).json({ success: false, message: 'Acesso restrito à gestão da cozinha.' });
    return;
  }

  res.status(401).send(`<!DOCTYPE html>
<html lang="pt-MZ">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Acesso Cozinha | Totally Baked Pemba</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-[#FAF7F9] flex items-center justify-center p-4 font-sans text-[#181114]">
  <form method="GET" action="/admin" class="bg-white border border-[#F0DEE7] rounded-3xl p-8 max-w-sm w-full shadow-lg space-y-4 text-center">
    <h1 class="text-2xl font-bold">Consola da Cozinha</h1>
    <p class="text-xs text-[#524149]">Insira o PIN operacional da Totally Baked Pemba para aceder ao painel de despacho.</p>
    <input type="password" name="pin" required autofocus placeholder="PIN Operacional" class="w-full px-4 py-3 rounded-xl border border-[#FFC4DE] text-center text-base outline-none focus:border-[#FF70B0]">
    <button type="submit" class="w-full py-3 rounded-full bg-[#FF70B0] text-white font-semibold text-sm hover:bg-[#E85295] transition">Entrar na Cozinha</button>
    <a href="/" class="block text-xs text-[#8A757F] hover:text-[#181114] pt-1">← Voltar ao site</a>
  </form>
</body>
</html>`);
}

// ================= ROTAS ADMINISTRATIVAS (/admin) =================
app.get('/admin', adminGuard, AdminController.getDashboard);
app.get('/api/admin/stats', adminGuard, AdminController.getStatsApi);
app.get('/api/admin/orders', adminGuard, AdminController.getOrdersApi);
app.post('/api/admin/orders/:id/status', adminGuard, AdminController.updateOrderStatus);
app.post('/api/admin/products/:id/toggle', adminGuard, AdminController.toggleProductAvailability);
app.post('/api/admin/products', adminGuard, AdminController.createProduct);
app.delete('/api/admin/products/:id', adminGuard, AdminController.deleteProduct);

// Healthcheck para monitorização em Produção / Vercel
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    environment: process.env.VERCEL ? 'vercel-serverless' : process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    service: 'Totally Baked Pemba — Plataforma Oficial de Encomendas & Catering',
    address: 'Rua da ANE, Bairro Alto Gingone, Pemba, Moçambique',
  });
});

// Tratamento de 404
app.use((req, res) => {
  res.status(404).render('404', {
    title: 'Página Não Encontrada | Totally Baked Pemba',
    activeNav: '',
  });
});

export default app;
export { app };

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🍰 Totally Baked Pemba Server ativo na porta ${PORT}`);
    console.log(`🌐 Website & Menu: http://localhost:${PORT}/`);
    console.log(`🛵 Rastreio Demo:  http://localhost:${PORT}/rastreio/ord-01`);
    console.log(`📊 Painel Cozinha: http://localhost:${PORT}/admin`);
  });
}
