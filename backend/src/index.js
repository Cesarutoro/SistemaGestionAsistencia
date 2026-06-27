const express = require("express");
const cors = require("cors");
const compression = require("compression");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

const estudiantesRoutes = require("./routes/estudiantes");
const cursosRoutes = require("./routes/cursos");
const asistenciaRoutes = require("./routes/asistencia");
const salidasAnticipadasRoutes = require("./routes/salidas-anticipadas");
const atrasosInternosRoutes = require("./routes/atrasos-internos");
const dashboardRoutes = require("./routes/dashboard");
const authRoutes = require("./routes/auth");
const usuariosRoutes = require("./routes/usuarios");
const auditRoutes = require("./routes/audit");
const anunciosRoutes = require("./routes/anuncios");
const { authMiddleware } = require("./middleware/auth");
const { runMigrations } = require("./migrations");
const db = require("./db");

dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

const app = express();
const PORT = process.env.PORT || 4000;

app.set('trust proxy', 1);

// Logging de tiempo de respuesta para peticiones lentas
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const elapsed = Date.now() - start;
    if (elapsed > 1000) {
      console.warn(`[slow] ${req.method} ${req.originalUrl} - ${elapsed}ms`);
    }
  });
  next();
});

// Seguridad: headers HTTP
const devConnectSrc = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:4000'];

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", ...(process.env.NODE_ENV === 'development' ? devConnectSrc : [])],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Compresión
app.use(compression());

// Rate limiting global: máximo 200 peticiones por minuto por IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones. Intenta de nuevo en un minuto.' },
});
app.use(globalLimiter);

// Parseo JSON con límite de tamaño
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use("/uploads", express.static("uploads"));

// CORS solo aplica a rutas /api
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
  'http://localhost:8084',
    'http://localhost:4000',
    'https://sistema-cesar.onrender.com',
];
if (process.env.FRONTEND_URL && !allowedOrigins.includes(process.env.FRONTEND_URL)) {
    allowedOrigins.push(process.env.FRONTEND_URL);
}
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(null, false);
        }
    },
    credentials: true,
};
app.options(/^\/api\//, cors(corsOptions));
app.use("/api", cors(corsOptions));

// Routes públicas (sin autenticación)
app.use("/api/auth", authRoutes);

// Routes protegidas (requieren token JWT)
app.use("/api/estudiantes", authMiddleware, estudiantesRoutes);
app.use("/api/cursos", authMiddleware, cursosRoutes);
app.use("/api/asistencia", authMiddleware, asistenciaRoutes);
app.use("/api/salidas-anticipadas", authMiddleware, salidasAnticipadasRoutes);
app.use("/api/atrasos-internos", authMiddleware, atrasosInternosRoutes);
app.use("/api/dashboard", authMiddleware, dashboardRoutes);
app.use("/api/usuarios", authMiddleware, usuariosRoutes);
app.use("/api/audit", authMiddleware, auditRoutes);
app.use("/api/anuncios", authMiddleware, anunciosRoutes);

// Servir Frontend
const frontendPath = path.join(__dirname, "..", "..", "frontend", "dist");
const indexHtml = path.join(frontendPath, "index.html");
console.log("[static] frontendPath:", frontendPath);
console.log("[static] index.html exists:", fs.existsSync(indexHtml));
console.log("[static] assets:", fs.existsSync(path.join(frontendPath, "assets"))
  ? fs.readdirSync(path.join(frontendPath, "assets")).join(", ")
  : "NO EXISTE");

app.use(
  express.static(frontendPath, {
    setHeaders: (res, filePath) => {
      if (path.basename(filePath) === "index.html") {
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
      }
    },
  }),
);

// SPA fallback
app.get(/.*/, (req, res, next) => {
  if (req.path.startsWith("/assets/")) {
    return res.status(404).send("Asset not found");
  }
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.sendFile(indexHtml);
});

// Error handler: no exponer detalles internos en producción
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  const message = process.env.NODE_ENV === 'production'
    ? 'Error interno del servidor'
    : err.message || 'Error interno del servidor';
  res.status(err.status || 500).json({ error: message });
});

const DEFAULT_SECRET = 'sistema_cesar_jwt_super_secreto_2024_cambiar_en_produccion';
if (process.env.JWT_SECRET === DEFAULT_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('[AVISO] Estás usando el JWT_SECRET por defecto en producción. Cámbialo en las variables de entorno del servidor.');
}

app.listen(PORT, async () => {
  await runMigrations();
  // Warmup: establecer conexión inicial a la BD para evitar latencia en primera query
  try {
    await db.query('SELECT 1');
    console.log('[db] Pool conectado y listo');
  } catch (_) {}
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
