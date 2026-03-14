const express = require("express");
const cors = require("cors");
const compression = require("compression");
const dotenv = require("dotenv");
const path = require("path");

const estudiantesRoutes = require("./routes/estudiantes");
const cursosRoutes = require("./routes/cursos");
const asistenciaRoutes = require("./routes/asistencia");
const salidasAnticipadasRoutes = require("./routes/salidas-anticipadas");
const dashboardRoutes = require("./routes/dashboard");
const authRoutes = require("./routes/auth");
const usuariosRoutes = require("./routes/usuarios");
const { authMiddleware } = require("./middleware/auth");

dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(compression());
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Routes públicas (sin autenticación)
app.use("/api/auth", authRoutes);

// Routes protegidas (requieren token JWT)
app.use("/api/estudiantes", authMiddleware, estudiantesRoutes);
app.use("/api/cursos", authMiddleware, cursosRoutes);
app.use("/api/asistencia", authMiddleware, asistenciaRoutes);
app.use("/api/salidas-anticipadas", authMiddleware, salidasAnticipadasRoutes);
app.use("/api/dashboard", authMiddleware, dashboardRoutes);
app.use("/api/usuarios", authMiddleware, usuariosRoutes);

// Servir Frontend
const frontendPath = path.join(__dirname, "..", "..", "frontend", "dist");
app.use(express.static(frontendPath));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
