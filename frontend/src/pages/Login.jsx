import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Lock, User, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err) {
      setError(err.response?.data?.error || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-stage">
        <section className="login-info">
          <div className="login-mark">
            <img src="/logoamj.png" alt="Logo AMJ" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
          </div>
          <div className="login-kicker">Acceso institucional</div>
          <h1 className="login-title">Portal de asistencia y seguimiento academico</h1>
          <p className="login-copy">
            Una interfaz limpia para inspectoria, direccion y administracion. El sistema centraliza asistencia, atrasos,
            salidas autorizadas y comunicacion interna sin desviar la atencion de la operacion diaria.
          </p>

          <div className="login-points">
            <div className="login-point">
              <div className="login-point-label">Uso diario</div>
              <div className="login-point-text">Registro rapido de asistencia, seguimiento de casos reiterados y supervision por curso.</div>
            </div>
            <div className="login-point">
              <div className="login-point-label">Enfoque</div>
              <div className="login-point-text">Diseño sobrio, lectura clara y estructura academica para trabajar durante toda la jornada.</div>
            </div>
            <div className="login-point">
              <div className="login-point-label">Acceso</div>
              <div className="login-point-text">Ingresa con tu correo institucional y tu clave asignada para continuar.</div>
            </div>
          </div>
        </section>

        <section className="login-form-panel">
          <div className="login-form-wrap">
            <h2 className="login-form-title">Iniciar sesion</h2>
            <p className="login-form-subtitle">Acceso seguro al portal institucional.</p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              <div>
                <label className="label">Correo Institucional</label>
                <div className="input-wrap">
                  <User size={18} className="input-icon" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@colegio.cl"
                    required
                    className="input input-with-icon"
                  />
                </div>
              </div>

              <div>
                <label className="label">Contraseña</label>
                <div className="input-wrap">
                  <Lock size={18} className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="input input-with-icon"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="input-action">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="login-error">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: "100%", padding: "0.9rem", marginTop: "0.3rem", opacity: loading ? 0.75 : 1 }}
              >
                {loading ? "Validando acceso..." : "Ingresar al Sistema"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
