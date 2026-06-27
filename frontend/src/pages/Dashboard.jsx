import { useEffect, useState, useCallback } from "react";
import { AlertTriangle, Users, TrendingUp, TrendingDown, Minus, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { apiDashboard } from "../api";

const CardSkeleton = () => (
  <div className="card skeleton-pulse" style={{ padding: "1.5rem" }}>
    <div style={{ height: 14, width: "60%", background: "#e2e8f0", borderRadius: 4, marginBottom: 12 }} />
    <div style={{ height: 28, width: "40%", background: "#e2e8f0", borderRadius: 4 }} />
  </div>
);

const TableSkeleton = ({ rows = 4 }) => (
  <div className="card skeleton-pulse" style={{ padding: 0, marginBottom: "1rem" }}>
    <div style={{ padding: "1rem", borderBottom: "1px solid #e2e8f0" }}>
      <div style={{ height: 16, width: "40%", background: "#e2e8f0", borderRadius: 4 }} />
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} style={{ padding: "1rem", borderBottom: i < rows - 1 ? "1px solid #e2e8f0" : "none" }}>
        <div style={{ height: 14, width: "70%", background: "#e2e8f0", borderRadius: 4 }} />
      </div>
    ))}
  </div>
);

const ChartSkeleton = () => (
  <div className="card skeleton-pulse" style={{ padding: 0 }}>
    <div style={{ padding: "1rem", borderBottom: "1px solid #e2e8f0" }}>
      <div style={{ height: 16, width: "50%", background: "#e2e8f0", borderRadius: 4 }} />
    </div>
    <div style={{ padding: "1.5rem", display: "flex", alignItems: "flex-end", gap: "0.5rem", height: 200 }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} style={{ flex: 1, height: `${30 + Math.random() * 70}%`, background: "#e2e8f0", borderRadius: "4px 4px 0 0" }} />
      ))}
    </div>
  </div>
);

const TrendBadge = ({ value, suffix = "%" }) => {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  if (num === 0) return <Minus size={14} color="#64748b" />;
  const isUp = num > 0;
  const color = isUp ? "#9a3f3f" : "#2f6b52";
  const Icon = isUp ? TrendingUp : TrendingDown;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: "0.75rem", fontWeight: 700, color }}>
      <Icon size={14} />
      {Math.abs(num).toFixed(1)}
      {suffix}
    </span>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        background: "white",
        border: "1px solid #d9d1c3",
        borderRadius: 12,
        padding: "0.6rem 0.8rem",
        boxShadow: "0 8px 20px rgba(36, 54, 75, 0.08)",
        fontSize: "0.85rem",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 4, color: "#24364b" }}>{label}</div>
      {payload.map((entry, i) => (
        <div key={i} style={{ color: entry.color, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: entry.color, display: "inline-block" }} />
          {entry.name}: <strong>{entry.value}</strong>
        </div>
      ))}
    </div>
  );
};

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);

  const loadDashboard = useCallback(async (fecha) => {
    setLoading(true);
    try {
      const resumen = await apiDashboard.obtenerResumen(fecha);
      setData(resumen);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard(selectedDate);
  }, [selectedDate, loadDashboard]);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  if (loading && !data) {
    return (
      <div>
        <header style={{ marginBottom: "1.5rem" }}>
          <div style={{ height: 22, width: 180, background: "#e2e8f0", borderRadius: 4, marginBottom: 8 }} />
          <div style={{ height: 14, width: 250, background: "#e2e8f0", borderRadius: 4 }} />
        </header>
        <CardSkeleton />
        <div style={{ marginTop: "1rem" }}>
          <TableSkeleton />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1rem" }}>
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  if (!data) {
    return <p>No hay información para mostrar.</p>;
  }

  const chartColor = "#24364b";
  const chartColorTeal = "#2f6b52";
  const chartColorAmber = "#8e6531";

  return (
    <div>
      <header className="page-header">
        <div>
          <div className="page-eyebrow">Control institucional</div>
          <h2 className="page-title">Panel operativo</h2>
          <p className="page-subtitle">Lectura diaria de asistencia, atrasos y focos de seguimiento por curso.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Calendar size={16} color="var(--text-muted)" />
          <input type="date" value={selectedDate} onChange={handleDateChange} className="input" style={{ width: "auto", padding: "0.4rem 0.75rem", fontSize: "0.85rem" }} />
        </div>
      </header>

      <section className="dashboard-summary">
        <div className="summary-meta">
          <div>
            <h3 className="summary-title">Corte diario de asistencia</h3>
            <div className="summary-note">Datos consolidados para la fecha seleccionada.</div>
          </div>
          <span className="badge badge-success">Actualizado</span>
        </div>

        <div className="kpi-strip">
          <div className="kpi-item">
            <div className="kpi-label">Total estudiantes</div>
            <div className="kpi-value-row">
              <span className="kpi-value">{data.total_estudiantes}</span>
              <Users size={20} color={chartColor} />
            </div>
            <div className="kpi-footnote">Matrícula visible para el control del día.</div>
          </div>

          <div className="kpi-item">
            <div className="kpi-label">Atrasos del dia</div>
            <div className="kpi-value-row">
              <span className="kpi-value" style={{ color: data.atrasos_hoy > 0 ? chartColorAmber : "var(--text-main)" }}>
                {data.atrasos_hoy}
              </span>
              <TrendBadge value={data.tendencia_atrasos} />
            </div>
            <div className="kpi-footnote">Comparado con ayer: {data.atrasos_ayer} registros.</div>
          </div>

          <div className="kpi-item">
            <div className="kpi-label">Casos semanales</div>
            <div className="kpi-value-row">
              <span className="kpi-value" style={{ color: data.estudiantes_3mas_atrasos_semana.length > 0 ? chartColorTeal : "var(--text-main)" }}>
                {data.estudiantes_3mas_atrasos_semana.length}
              </span>
              <TrendingUp size={20} color={chartColorTeal} />
            </div>
            <div className="kpi-footnote">Estudiantes con tres o más atrasos esta semana.</div>
          </div>
        </div>
      </section>

      {data.estudiantes_3mas_atrasos_semana.length > 0 && (
        <section className="section-panel" style={{ marginBottom: "1.4rem" }}>
          <div className="section-panel-header">
            <div className="section-panel-title">
              <AlertTriangle size={18} color={chartColorAmber} />
              <h3>Seguimiento semanal prioritario</h3>
            </div>
            <span className="badge badge-warning">{data.estudiantes_3mas_atrasos_semana.length}</span>
          </div>
          <div className="table-container" style={{ border: 0, borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th className="col-optional">Curso</th>
                  <th>Atrasos</th>
                </tr>
              </thead>
              <tbody>
                {data.estudiantes_3mas_atrasos_semana.map((item) => (
                  <tr key={item.estudiante_id}>
                    <td>
                      {item.apellido}, {item.nombre}
                    </td>
                    <td className="col-optional">{item.curso_nombre}</td>
                    <td>
                      <span className="badge badge-warning">{item.total_atrasos}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="dashboard-grid">
        <section className="section-panel">
          <div className="section-panel-header">
            <div className="section-panel-title">
              <TrendingUp size={18} color={chartColorTeal} />
              <h3>Ranking de cursos por semana</h3>
            </div>
          </div>
          {data.ranking_cursos_semana.length === 0 ? (
            <div className="section-empty">Sin datos de semana.</div>
          ) : (
            <div style={{ padding: "0.9rem" }}>
              <ResponsiveContainer width="100%" height={Math.max(180, data.ranking_cursos_semana.length * 32)}>
                <BarChart data={data.ranking_cursos_semana} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#667485" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="curso_nombre" width={110} tick={{ fontSize: 11, fill: "#425365" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f5f0e7" }} />
                  <Bar dataKey="total_atrasos" fill={chartColor} radius={[0, 4, 4, 0]} name="Atrasos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="section-panel">
          <div className="section-panel-header">
            <div className="section-panel-title">
              <TrendingUp size={18} color={chartColorAmber} />
              <h3>Ranking de cursos por mes</h3>
            </div>
          </div>
          {data.ranking_cursos_mes.length === 0 ? (
            <div className="section-empty">Sin datos de mes.</div>
          ) : (
            <div style={{ padding: "0.9rem" }}>
              <ResponsiveContainer width="100%" height={Math.max(180, data.ranking_cursos_mes.length * 32)}>
                <BarChart data={data.ranking_cursos_mes} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#667485" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="curso_nombre" width={110} tick={{ fontSize: 11, fill: "#425365" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f5f0e7" }} />
                  <Bar dataKey="total_atrasos" fill={chartColorAmber} radius={[0, 4, 4, 0]} name="Atrasos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
