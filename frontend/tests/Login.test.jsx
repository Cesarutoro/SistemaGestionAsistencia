// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Login from "../src/pages/Login";

const mockLogin = vi.fn();

vi.mock("../src/context/AuthContext", () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}));

describe("Login page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza todos los campos e imagen", () => {
    render(<Login />);
    expect(screen.getByText("Portal Institucional")).toBeTruthy();
    expect(screen.getByText("Correo Institucional")).toBeTruthy();
    expect(screen.getByText("Contraseña")).toBeTruthy();
    expect(screen.getByPlaceholderText("usuario@colegio.cl")).toBeTruthy();
    expect(screen.getByPlaceholderText("••••••••")).toBeTruthy();
    expect(screen.getByText("Ingresar al Sistema")).toBeTruthy();
  });

  it("permite cambiar la visibilidad de la contraseña", () => {
    render(<Login />);
    const passInput = screen.getByPlaceholderText("••••••••");
    expect(passInput.type).toBe("password");

    // Encontrar boton de toggle por clase o boton
    const toggleBtn = screen.getByRole("button", { name: "" }); // El boton de toggle no tiene texto pero contiene un SVG
    fireEvent.click(toggleBtn);

    expect(passInput.type).toBe("text");
  });

  it("llama a login con los valores ingresados al enviar el formulario", async () => {
    mockLogin.mockResolvedValueOnce({});
    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText("usuario@colegio.cl"), {
      target: { value: "Inspector@Establecimiento.cl" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "pass123" },
    });

    fireEvent.click(screen.getByText("Ingresar al Sistema"));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("inspector@establecimiento.cl", "pass123");
    });
  });

  it("muestra error si falla el login", async () => {
    const errorResponse = {
      response: {
        data: { error: "Credenciales inválidas" },
      },
    };
    mockLogin.mockRejectedValueOnce(errorResponse);
    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText("usuario@colegio.cl"), {
      target: { value: "test@test.cl" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "incorrecta" },
    });

    fireEvent.click(screen.getByText("Ingresar al Sistema"));

    await waitFor(() => {
      expect(screen.getByText("Credenciales inválidas")).toBeTruthy();
    });
  });
});
