// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import api from "../src/api";

vi.mock("../src/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    defaults: {
      headers: {
        common: {},
      },
    },
  },
}));

function AuthConsumerComponent() {
  const { user, login, logout, loading, canAccess, homeRoute } = useAuth();
  if (loading) return <div>Cargando...</div>;
  return (
    <div>
      {user ? (
        <div>
          <span data-testid="user-email">{user.email}</span>
          <span data-testid="home-route">{homeRoute}</span>
          <span data-testid="can-access-asistencia">{canAccess("asistencia") ? "si" : "no"}</span>
          <button onClick={logout}>Salir</button>
        </div>
      ) : (
        <div>
          <span>Sin sesion</span>
          <button onClick={() => login("test@test.com", "pass123")}>Ingresar</button>
        </div>
      )}
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    api.defaults.headers.common = {};
  });

  it("inicializa como no cargado y sin sesion si no hay token", async () => {
    render(
      <AuthProvider>
        <AuthConsumerComponent />
      </AuthProvider>
    );

    expect(screen.getByText("Sin sesion")).toBeTruthy();
    expect(api.get).not.toHaveBeenCalled();
  });

  it("verifica sesion al montar si existe un token en localStorage", async () => {
    localStorage.setItem("token", "fake-token-123");
    api.get.mockResolvedValueOnce({ data: { usuario: { email: "admin@establecimiento.cl", rol: "admin", permisos: [] } } });

    render(
      <AuthProvider>
        <AuthConsumerComponent />
      </AuthProvider>
    );

    // Debe mostrar cargando inicialmente
    expect(screen.getByText("Cargando...")).toBeTruthy();

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/auth/me");
    });
    expect(api.defaults.headers.common["Authorization"]).toBe("Bearer fake-token-123");
    expect(screen.getByTestId("user-email").textContent).toBe("admin@establecimiento.cl");
  });

  it("limpia el token si la verificacion /auth/me falla", async () => {
    localStorage.setItem("token", "invalid-token");
    api.get.mockRejectedValueOnce(new Error("Unauthorized"));

    render(
      <AuthProvider>
        <AuthConsumerComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Sin sesion")).toBeTruthy();
    });
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("realiza login con exito", async () => {
    api.post.mockResolvedValueOnce({
      data: {
        token: "session-token",
        usuario: { email: "inspector@establecimiento.cl", rol: "inspector", permisos: [{ clave: "asistencia", readOnly: false }] },
      },
    });

    render(
      <AuthProvider>
        <AuthConsumerComponent />
      </AuthProvider>
    );

    const loginBtn = screen.getByText("Ingresar");
    fireEvent.click(loginBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/auth/login", { email: "test@test.com", password: "pass123" });
    });

    expect(localStorage.getItem("token")).toBe("session-token");
    expect(screen.getByTestId("user-email").textContent).toBe("inspector@establecimiento.cl");
    expect(screen.getByTestId("can-access-asistencia").textContent).toBe("si");
  });

  it("realiza logout correctamente", async () => {
    localStorage.setItem("token", "some-token");
    api.get.mockResolvedValueOnce({ data: { usuario: { email: "inspector@test.com", rol: "inspector", permisos: [] } } });
    api.post.mockResolvedValueOnce({}); // logout endpoint

    render(
      <AuthProvider>
        <AuthConsumerComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Salir")).toBeTruthy();
    });

    const logoutBtn = screen.getByText("Salir");
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/auth/logout");
    });
    expect(localStorage.getItem("token")).toBeNull();
    expect(screen.getByText("Sin sesion")).toBeTruthy();
  });

  it("responde al evento auth:sessionExpired cerrando sesion", async () => {
    localStorage.setItem("token", "some-token");
    api.get.mockResolvedValueOnce({ data: { usuario: { email: "inspector@test.com", rol: "inspector", permisos: [] } } });

    render(
      <AuthProvider>
        <AuthConsumerComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Salir")).toBeTruthy();
    });

    // Simular evento
    const expiredEvent = new Event("auth:sessionExpired");
    act(() => {
      window.dispatchEvent(expiredEvent);
    });

    await waitFor(() => {
      expect(screen.getByText("Sin sesion")).toBeTruthy();
    });
  });
});
