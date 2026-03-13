import React, { useEffect, useState } from "react";
import { BarChart3, AlertTriangle, Users, CalendarClock } from "lucide-react";
import { apiDashboard } from "../api";

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const response = await apiDashboard.obtenerResumen();
        setData(response);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return <p>Cargando dashboard...</p>;
  }

  if (!data) {
    return <p>No hay información para mostrar.</p>;
  }

  return (
    <div>
      <header style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.4rem", marginBottom: "0.35rem" }}>
          Dashboard
        </h2>
        <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
          Resumen operativo de atrasos ({data.fecha})
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "0.85rem",
          marginBottom: "1rem",
        }}
      >
        <div className="card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ color: "#64748b", fontSize: "0.8rem" }}>
                Total Estudiantes
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                {data.total_estudiantes}
              </div>
            </div>
            <Users size={22} color="#1e40af" />
          </div>
        </div>

        <div className="card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ color: "#64748b", fontSize: "0.8rem" }}>
                Atrasos de Hoy
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                {data.atrasos_hoy}
              </div>
            </div>
            <AlertTriangle size={22} color="#b45309" />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "1rem", padding: 0 }}>
        <div
          style={{
            padding: "1rem",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
          }}
        >
          <CalendarClock size={18} color="#1e40af" />
          <h3 style={{ fontSize: "1rem" }}>
            Estudiantes con 3+ atrasos en la semana
          </h3>
        </div>
        <div className="table-container" style={{ border: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Curso</th>
                <th>Atrasos Semana</th>
              </tr>
            </thead>
            <tbody>
              {data.estudiantes_3mas_atrasos_semana.length === 0 ? (
                <tr>
                  <td
                    colSpan="3"
                    style={{
                      textAlign: "center",
                      color: "#94a3b8",
                      padding: "1rem",
                    }}
                  >
                    Sin estudiantes sobre umbral esta semana.
                  </td>
                </tr>
              ) : (
                data.estudiantes_3mas_atrasos_semana.map((item) => (
                  <tr key={item.estudiante_id}>
                    <td>
                      {item.apellido}, {item.nombre}
                    </td>
                    <td>{item.curso_nombre}</td>
                    <td>
                      <span className="badge badge-warning">
                        {item.total_atrasos}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1rem",
        }}
      >
        <div className="card" style={{ padding: 0 }}>
          <div
            style={{
              padding: "1rem",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
            }}
          >
            <BarChart3 size={18} color="#0f766e" />
            <h3 style={{ fontSize: "1rem" }}>
              Ranking cursos con más atrasos (Semana)
            </h3>
          </div>
          <div className="table-container" style={{ border: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Curso</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {data.ranking_cursos_semana.length === 0 ? (
                  <tr>
                    <td
                      colSpan="2"
                      style={{
                        textAlign: "center",
                        color: "#94a3b8",
                        padding: "1rem",
                      }}
                    >
                      Sin datos de semana.
                    </td>
                  </tr>
                ) : (
                  data.ranking_cursos_semana.map((item) => (
                    <tr key={`sem-${item.curso_id}`}>
                      <td>{item.curso_nombre}</td>
                      <td>
                        <span className="badge badge-warning">
                          {item.total_atrasos}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div
            style={{
              padding: "1rem",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
            }}
          >
            <BarChart3 size={18} color="#7c3aed" />
            <h3 style={{ fontSize: "1rem" }}>
              Ranking cursos con más atrasos (Mes)
            </h3>
          </div>
          <div className="table-container" style={{ border: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Curso</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {data.ranking_cursos_mes.length === 0 ? (
                  <tr>
                    <td
                      colSpan="2"
                      style={{
                        textAlign: "center",
                        color: "#94a3b8",
                        padding: "1rem",
                      }}
                    >
                      Sin datos de mes.
                    </td>
                  </tr>
                ) : (
                  data.ranking_cursos_mes.map((item) => (
                    <tr key={`mes-${item.curso_id}`}>
                      <td>{item.curso_nombre}</td>
                      <td>
                        <span className="badge badge-warning">
                          {item.total_atrasos}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
