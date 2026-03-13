import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Asistencia from "./pages/Asistencia";
import Estudiantes from "./pages/Estudiantes";
import Atrasos from "./pages/Atrasos";
import Cursos from "./pages/Cursos";
import Usuarios from "./pages/Usuarios";
import SalidasAnticipadas from "./pages/SalidasAnticipadas";
import Dashboard from "./pages/Dashboard";

function AppRoutes() {
  const { user, loading } = useAuth();

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
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/asistencia" element={<Asistencia />} />
          <Route path="/atrasos" element={<Atrasos />} />
          <Route path="/salidas-anticipadas" element={<SalidasAnticipadas />} />
          <Route path="/estudiantes" element={<Estudiantes />} />
          <Route path="/cursos" element={<Cursos />} />
          <Route
            path="/usuarios"
            element={user?.rol === "admin" ? <Usuarios /> : <Navigate to="/" />}
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
