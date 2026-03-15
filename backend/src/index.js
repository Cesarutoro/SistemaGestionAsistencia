const express = require("express");
const cors = require("cors");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const path = require("path");

const estudiantesRoutes = require("./routes/estudiantes");
const cursosRoutes = require("./routes/cursos");
const asistenciaRoutes = require("./routes/asistencia");
const salidasAnticipadasRoutes = require("./routes/salidas-anticipadas");
const dashboardRoutes = require("./routes/dashboard");
const authRoutes = require("./routes/auth");
const usuariosRoutes = require("./routes/usuarios");
const auditRoutes = require("./routes/audit");
const { authMiddleware } = require("./middleware/auth");
const { runMigrations } = require("./migrations");

dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(compression());

app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static("uploads"));

// CORS solo aplica a rutas /api — los archivos estáticos del frontend
// no necesitan CORS (mismo origen en producción) y el crossorigin attribute
// de Vite causaba que el browser enviara Origin header, el cual era rechazado.
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:4000',
    'https://sistema-cesar.onrender.com',   // producción hardcodeada como fallback
];
if (process.env.FRONTEND_URL && !allowedOrigins.includes(process.env.FRONTEND_URL)) {
    allowedOrigins.push(process.env.FRONTEND_URL);
}
const corsOptions = {
    origin: (origin, callback) => {
        // Sin origin = curl / servidor / mismo origen — siempre permitir
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            // Rechazar sin lanzar error para evitar HTTP 500
            callback(null, false);
        }
    },
    credentials: true,
};
// Responder preflights OPTIONS explícitamente para evitar que lleguen a rutas protegidas
app.options('/api/*', cors(corsOptions));
app.use("/api", cors(corsOptions));

// Routes públicas (sin autenticación)
app.use("/api/auth", authRoutes);

// Routes protegidas (requieren token JWT)
app.use("/api/estudiantes", authMiddleware, estudiantesRoutes);
app.use("/api/cursos", authMiddleware, cursosRoutes);
app.use("/api/asistencia", authMiddleware, asistenciaRoutes);
app.use("/api/salidas-anticipadas", authMiddleware, salidasAnticipadasRoutes);
app.use("/api/dashboard", authMiddleware, dashboardRoutes);
app.use("/api/usuarios", authMiddleware, usuariosRoutes);
app.use("/api/audit", authMiddleware, auditRoutes);

// Servir Frontend
const frontendPath = path.join(__dirname, "..", "..", "frontend", "dist");
const indexHtml = path.join(frontendPath, "index.html");
const fs = require("fs");
console.log("[static] frontendPath:", frontendPath);
console.log("[static] index.html exists:", fs.existsSync(indexHtml));
console.log("[static] assets:", fs.existsSync(path.join(frontendPath, "assets"))
  ? fs.readdirSync(path.join(frontendPath, "assets")).join(", ")
  : "NO EXISTE");

app.use(express.static(frontendPath));

// SPA fallback: solo para rutas que NO sean /assets/* ni /api/*
// Así devolvemos 404 claro en vez de HTML si falta un asset.
app.get(/.*/, (req, res, next) => {
  if (req.path.startsWith("/assets/")) {
    return res.status(404).send("Asset not found");
  }
  res.sendFile(indexHtml);
});

app.listen(PORT, async () => {
  await runMigrations();
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
