import { BarChart3, TrendingUp, TrendingDown, Minus } from "lucide-react";

const formatFecha = (fecha) => {
  if (!fecha) return "—";
  const [year, month, day] = fecha.split("-");
  return `${day}/${month}/${year}`;
};

const StatCard = ({ label, value, hint, accent }) => (
  <div
    className="card"
    style={{
      padding: "1rem",
      borderTop: `3px solid ${accent || "#1e3a8a"}`,
    }}
  >
    <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.35rem" }}>
      {label}
    </div>
    <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a" }}>
      {value}
    </div>
    {hint && (
      <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.25rem" }}>
        {hint}
      </div>
    )}
  </div>
);

const TendenciaBadge = ({ tendencia, variacion }) => {
  if (tendencia === "aumento") {
    return (
      <span
        className="badge badge-danger"
        style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
      >
        <TrendingUp size={14} />
        Aumento {variacion > 0 ? `(+${variacion}%)` : ""}
      </span>
    );
  }
  if (tendencia === "disminucion") {
    return (
      <span
        className="badge badge-success"
        style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
      >
        <TrendingDown size={14} />
        Disminución {variacion !== 0 ? `(${variacion}%)` : ""}
      </span>
    );
  }
  if (tendencia === "estable") {
    return (
      <span
        className="badge"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.25rem",
          background: "#e2e8f0",
          color: "#475569",
        }}
      >
        <Minus size={14} />
        Estable
      </span>
    );
  }
  return (
    <span className="badge" style={{ background: "#f1f5f9", color: "#64748b" }}>
      Sin datos previos
    </span>
  );
};

const EstudianteAtrasosStats = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="card skeleton-pulse" style={{ marginBottom: "1.5rem", padding: "1.5rem" }}>
        <div style={{ height: 16, width: "35%", background: "#e2e8f0", borderRadius: 4, marginBottom: 12 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ height: 72, background: "#e2e8f0", borderRadius: 8 }} />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const { estudiante, periodo, atrasos_ingreso, atrasos_internos, resumen } = stats;

  return (
    <div className="card" style={{ marginBottom: "1.5rem", padding: "1.5rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "1rem",
          flexWrap: "wrap",
          marginBottom: "1.25rem",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.35rem",
            }}
          >
            <BarChart3 size={18} color="#1e3a8a" />
            <h3 style={{ fontSize: "1.05rem", margin: 0 }}>
              Seguimiento de atrasos
            </h3>
          </div>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
            {estudiante.apellido}, {estudiante.nombre} · {estudiante.rut} ·{" "}
            {estudiante.curso_nombre}
          </p>
          {periodo.inicio && (
            <p style={{ margin: "0.35rem 0 0", color: "#94a3b8", fontSize: "0.8rem" }}>
              Periodo analizado: {formatFecha(periodo.inicio)} — {formatFecha(periodo.fin)}
            </p>
          )}
        </div>
        <TendenciaBadge
          tendencia={atrasos_ingreso.tendencia_mes}
          variacion={atrasos_ingreso.variacion_mes_pct}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "0.75rem",
          marginBottom: "1.25rem",
        }}
      >
        <StatCard
          label="Total eventos"
          value={resumen.total_eventos}
          hint="Ingreso + internos"
          accent="#1e3a8a"
        />
        <StatCard
          label="Atrasos ingreso"
          value={atrasos_ingreso.total}
          hint={`${atrasos_ingreso.esta_semana} esta semana · ${atrasos_ingreso.este_mes} este mes`}
          accent="#b45309"
        />
        <StatCard
          label="Justificados"
          value={`${atrasos_ingreso.porcentaje_justificados}%`}
          hint={`${atrasos_ingreso.justificados} de ${atrasos_ingreso.total}`}
          accent="#0f766e"
        />
        <StatCard
          label="Promedio semanal"
          value={atrasos_ingreso.promedio_semanal}
          hint="Atrasos de ingreso"
          accent="#7c3aed"
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1rem",
        }}
      >
        <div
          style={{
            background: "#f8fafc",
            borderRadius: "8px",
            padding: "1rem",
            border: "1px solid #e2e8f0",
          }}
        >
          <h4 style={{ fontSize: "0.85rem", margin: "0 0 0.75rem", color: "#475569" }}>
            Atrasos de ingreso
          </h4>
          <div style={{ display: "grid", gap: "0.45rem", fontSize: "0.85rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>No justificados</span>
              <strong>{atrasos_ingreso.no_justificados}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>Día más frecuente</span>
              <strong>{atrasos_ingreso.dia_frecuente || "—"}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>Primer atraso</span>
              <strong>{formatFecha(atrasos_ingreso.primer_atraso)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>Último atraso</span>
              <strong>{formatFecha(atrasos_ingreso.ultimo_atraso)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>Mes anterior</span>
              <strong>{atrasos_ingreso.mes_anterior}</strong>
            </div>
          </div>
        </div>

        <div
          style={{
            background: "#f8fafc",
            borderRadius: "8px",
            padding: "1rem",
            border: "1px solid #e2e8f0",
          }}
        >
          <h4 style={{ fontSize: "0.85rem", margin: "0 0 0.75rem", color: "#475569" }}>
            Atrasos internos (recreo / almuerzo)
          </h4>
          <div style={{ display: "grid", gap: "0.45rem", fontSize: "0.85rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>Total registros</span>
              <strong>{atrasos_internos.total_registros}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>Minutos acumulados</span>
              <strong>{atrasos_internos.total_minutos} min</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>Promedio por evento</span>
              <strong>{atrasos_internos.promedio_minutos} min</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>Recreo</span>
              <strong>
                {atrasos_internos.recreo.cantidad} ({atrasos_internos.recreo.minutos_total} min)
              </strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>Almuerzo</span>
              <strong>
                {atrasos_internos.almuerzo.cantidad} ({atrasos_internos.almuerzo.minutos_total} min)
              </strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>Esta semana / mes</span>
              <strong>
                {atrasos_internos.esta_semana} / {atrasos_internos.este_mes}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstudianteAtrasosStats;
