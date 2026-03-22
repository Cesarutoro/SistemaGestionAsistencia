import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DataCacheProvider } from "./context/DataCacheContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Asistencia from "./pages/Asistencia";
import Estudiantes from "./pages/Estudiantes";
import Atrasos from "./pages/Atrasos";
import Cursos from "./pages/Cursos";
import Usuarios from "./pages/Usuarios";
import SalidasAnticipadas from "./pages/SalidasAnticipadas";
import Dashboard from "./pages/Dashboard";

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
        <Route path="*" element={<Navigate to={homeRoute} replace />} />
      </Routes>
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
