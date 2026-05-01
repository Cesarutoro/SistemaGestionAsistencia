import { useEffect, useState, useCallback } from "react";
import { AlertTriangle, Users, TrendingUp, TrendingDown, Minus, Calendar } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
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
  const color = isUp ? "#dc2626" : "#059669";
  const Icon = isUp ? TrendingUp : TrendingDown;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: "0.75rem", fontWeight: 600, color }}>
      <Icon size={14} />
      {Math.abs(num).toFixed(1)}{suffix}
    </span>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 8, padding: "0.5rem 0.75rem", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "0.85rem" }}>
      <div style={{ fontWeight: 600, marginBottom: 4, color: "#0f172a" }}>{label}</div>
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.85rem", marginBottom: "1rem" }}>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <TableSkeleton />
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

  const chartColor = "#1e3a8a";
  const chartColorTeal = "#0f766e";
  const chartColorAmber = "#b45309";

  return (
    <div>
      <header style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h2 style={{ fontSize: "1.4rem", marginBottom: "0.35rem" }}>Dashboard</h2>
          <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
            Resumen operativo de atrasos
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Calendar size={16} color="#64748b" />
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="input"
            style={{ width: "auto", padding: "0.4rem 0.75rem", fontSize: "0.85rem" }}
          />
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.85rem", marginBottom: "1.5rem" }}>
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: "#64748b", fontSize: "0.8rem", marginBottom: 4 }}>
                Total Estudiantes
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a" }}>
                {data.total_estudiantes}
              </div>
            </div>
            <Users size={22} color={chartColor} />
          </div>
        </div>

        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: "#64748b", fontSize: "0.8rem", marginBottom: 4 }}>
                Atrasos de Hoy
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
                <span style={{ fontSize: "1.5rem", fontWeight: 700, color: data.atrasos_hoy > 0 ? "#b45309" : "#0f172a" }}>
                  {data.atrasos_hoy}
                </span>
                <TrendBadge value={data.tendencia_atrasos} />
              </div>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 2 }}>
                vs ayer ({data.atrasos_ayer})
              </div>
            </div>
            <AlertTriangle size={22} color={data.atrasos_hoy > 0 ? chartColorAmber : "#94a3b8"} />
          </div>
        </div>

        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: "#64748b", fontSize: "0.8rem", marginBottom: 4 }}>
                3+ Atrasos (Semana)
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: data.estudiantes_3mas_atrasos_semana.length > 0 ? "#b45309" : "#0f172a" }}>
                {data.estudiantes_3mas_atrasos_semana.length}
              </div>
            </div>
            <TrendingUp size={22} color={chartColorTeal} />
          </div>
        </div>
      </div>

      {data.estudiantes_3mas_atrasos_semana.length > 0 && (
        <div className="card" style={{ marginBottom: "1.5rem", padding: 0 }}>
          <div style={{ padding: "1rem", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <AlertTriangle size={18} color={chartColorAmber} />
            <h3 style={{ fontSize: "1rem" }}>
              Estudiantes con 3+ atrasos en la semana
            </h3>
            <span className="badge badge-warning" style={{ marginLeft: "auto" }}>
              {data.estudiantes_3mas_atrasos_semana.length}
            </span>
          </div>
          <div className="table-container" style={{ border: 0 }}>
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
                    <td>{item.apellido}, {item.nombre}</td>
                    <td className="col-optional">{item.curso_nombre}</td>
                    <td>
                      <span className="badge badge-warning">{item.total_atrasos}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: "1rem", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <TrendingUp size={18} color={chartColorTeal} />
            <h3 style={{ fontSize: "1rem" }}>Ranking cursos (Semana)</h3>
          </div>
          {data.ranking_cursos_semana.length === 0 ? (
            <div style={{ padding: "1.5rem", textAlign: "center", color: "#94a3b8", fontSize: "0.9rem" }}>
              Sin datos de semana.
            </div>
          ) : (
            <div style={{ padding: "0.75rem" }}>
              <ResponsiveContainer width="100%" height={Math.max(180, data.ranking_cursos_semana.length * 32)}>
                <BarChart data={data.ranking_cursos_semana} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="curso_nombre" width={100} tick={{ fontSize: 11, fill: "#334155" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
                  <Bar dataKey="total_atrasos" fill={chartColor} radius={[0, 4, 4, 0]} name="Atrasos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: "1rem", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <TrendingUp size={18} color={chartColorAmber} />
            <h3 style={{ fontSize: "1rem" }}>Ranking cursos (Mes)</h3>
          </div>
          {data.ranking_cursos_mes.length === 0 ? (
            <div style={{ padding: "1.5rem", textAlign: "center", color: "#94a3b8", fontSize: "0.9rem" }}>
              Sin datos de mes.
            </div>
          ) : (
            <div style={{ padding: "0.75rem" }}>
              <ResponsiveContainer width="100%" height={Math.max(180, data.ranking_cursos_mes.length * 32)}>
                <BarChart data={data.ranking_cursos_mes} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="curso_nombre" width={100} tick={{ fontSize: 11, fill: "#334155" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
                  <Bar dataKey="total_atrasos" fill={chartColorAmber} radius={[0, 4, 4, 0]} name="Atrasos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>


    </div>
  );
};

export default Dashboard;
