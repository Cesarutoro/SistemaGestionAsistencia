import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { X, Megaphone, AlertTriangle, Wrench } from "lucide-react";
import api from "../api";

const tipoConfig = {
  info: { bg: "#eff6ff", border: "#93c5fd", color: "#1e3a8a", icon: Megaphone },
  warning: { bg: "#fef3c7", border: "#fde68a", color: "#92400e", icon: AlertTriangle },
  maintenance: { bg: "#fef2f2", border: "#fecaca", color: "#991b1b", icon: Wrench },
};

const STORAGE_KEY = "dismissed_anuncios";

const AnuncioBanner = () => {
  const [anuncios, setAnuncios] = useState([]);
  const location = useLocation();

  const [dismissed, setDismissed] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  });

  const fetchAnuncios = useCallback(async () => {
    try {
      const res = await api.get("/anuncios");
      setAnuncios(res.data || []);
    } catch {
      // silencioso
    }
  }, []);

  useEffect(() => {
    fetchAnuncios();
  }, [fetchAnuncios, location.pathname]);

  const dismissPermanente = (id) => {
    const updated = [...dismissed, id];
    setDismissed(updated);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const activos = anuncios.filter((a) => !dismissed.includes(a.id));
  if (activos.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
      {activos.map((anuncio) => {
        const config = tipoConfig[anuncio.tipo] || tipoConfig.info;
        const Icon = config.icon;
        const esPersistente = anuncio.tipo === "maintenance";
        return (
          <div
            key={anuncio.id}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.75rem",
              padding: "0.85rem 1.25rem",
              borderRadius: 12,
              border: `1px solid ${config.border}`,
              background: config.bg,
              color: config.color,
              fontSize: "0.9rem",
            }}
          >
            <Icon size={18} style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong style={{ display: "block", marginBottom: "0.15rem" }}>
                {anuncio.titulo}
              </strong>
              <span>{anuncio.mensaje}</span>
            </div>
            <button
              onClick={() => !esPersistente && dismissPermanente(anuncio.id)}
              title={esPersistente ? "Este aviso no se puede cerrar" : "Ocultar este aviso por el resto de la sesión"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                background: esPersistente ? "transparent" : config.bg,
                border: `1px solid ${config.border}`,
                color: config.color,
                borderRadius: 6,
                padding: "0.3rem 0.6rem",
                cursor: esPersistente ? "default" : "pointer",
                fontSize: "0.75rem",
                fontWeight: 500,
                whiteSpace: "nowrap",
                flexShrink: 0,
                opacity: esPersistente ? 0.5 : 0.85,
              }}
            >
              <X size={13} />
              {esPersistente ? "Obligatorio" : "Cerrar"}
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default AnuncioBanner;
