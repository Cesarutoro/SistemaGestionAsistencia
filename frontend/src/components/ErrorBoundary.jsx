import { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "3rem 1rem",
            color: "#64748b",
            textAlign: "center",
          }}
        >
          <AlertTriangle size={32} color="#b45309" style={{ marginBottom: "0.75rem" }} />
          <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem", color: "#0f172a" }}>
            Algo salió mal
          </h3>
          <p style={{ fontSize: "0.9rem", marginBottom: "1.5rem", maxWidth: 400 }}>
            {this.state.error?.message || "Ocurrió un error inesperado en esta sección."}
          </p>
          <button
            className="btn btn-primary"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
          >
            <RefreshCw size={16} />
            Recargar página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
