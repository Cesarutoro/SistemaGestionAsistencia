import { lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DataCacheProvider } from "./context/DataCacheContext";
import Layout from "./components/Layout";
import ErrorBoundary from "./components/ErrorBoundary";

const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Asistencia = lazy(() => import("./pages/Asistencia"));
const Estudiantes = lazy(() => import("./pages/Estudiantes"));
const Atrasos = lazy(() => import("./pages/Atrasos"));
const Cursos = lazy(() => import("./pages/Cursos"));
const Usuarios = lazy(() => import("./pages/Usuarios"));
const SalidasAnticipadas = lazy(() => import("./pages/SalidasAnticipadas"));
const AtrasosInternos = lazy(() => import("./pages/AtrasosInternos"));
const AnunciosAdmin = lazy(() => import("./pages/AnunciosAdmin"));

const PageLoading = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "3rem",
      color: "#64748b",
      fontSize: "0.9rem",
    }}
  >
    Cargando...
  </div>
);

function ModuleGuard({ permission, children }) {
  const { canAccess, homeRoute } = useAuth();

  if (!canAccess(permission)) {
    return <Navigate to={homeRoute} replace />;
  }

  return children;
}

function AppRoutes() {
  const { user, loading, homeRoute } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          color: "#64748b",
        }}
      >
        Cargando...
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Layout>
      <ErrorBoundary>
      <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route path="/" element={<Navigate to={homeRoute} replace />} />
          <Route
            path="/dashboard"
            element={
              <ModuleGuard permission="dashboard">
                <Dashboard />
              </ModuleGuard>
            }
          />
          <Route
            path="/asistencia"
            element={
              <ModuleGuard permission="asistencia">
                <Asistencia />
              </ModuleGuard>
            }
          />
          <Route
            path="/atrasos"
            element={
              <ModuleGuard permission="atrasos">
                <Atrasos />
              </ModuleGuard>
            }
          />
          <Route
            path="/atrasos-internos"
            element={
              <ModuleGuard permission="atrasos-internos">
                <AtrasosInternos />
              </ModuleGuard>
            }
          />
          <Route
            path="/salidas-anticipadas"
            element={
              <ModuleGuard permission="salidas-anticipadas">
                <SalidasAnticipadas />
              </ModuleGuard>
            }
          />
          <Route
            path="/estudiantes"
            element={
              <ModuleGuard permission="estudiantes">
                <Estudiantes />
              </ModuleGuard>
            }
          />
          <Route
            path="/cursos"
            element={
              <ModuleGuard permission="cursos">
                <Cursos />
              </ModuleGuard>
            }
          />
          <Route
            path="/usuarios"
            element={user?.rol === "admin" ? <Usuarios /> : <Navigate to={homeRoute} replace />}
          />
          <Route
            path="/anuncios"
            element={user?.rol === "admin" ? <AnunciosAdmin /> : <Navigate to={homeRoute} replace />}
          />
          <Route path="*" element={<Navigate to={homeRoute} replace />} />
        </Routes>
      </Suspense>
      </ErrorBoundary>
    </Layout>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <DataCacheProvider>
          <AppRoutes />
        </DataCacheProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
