// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AnuncioBanner from "../src/components/AnuncioBanner";
import api from "../src/api";

vi.mock("../src/api", () => ({
  default: {
    get: vi.fn(),
  },
}));

describe("AnuncioBanner component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it("no muestra nada si no hay anuncios activos", async () => {
    api.get.mockResolvedValueOnce({ data: [] });
    const { container } = render(
      <MemoryRouter>
        <AnuncioBanner />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/anuncios");
    });
    expect(container.firstChild).toBeNull();
  });

  it("renderiza anuncios del tipo correcto", async () => {
    const anunciosMock = [
      { id: 1, titulo: "Mantenimiento programado", mensaje: "Hoy a las 20:00", tipo: "maintenance" },
      { id: 2, titulo: "Aviso importante", mensaje: "Revisar notas", tipo: "warning" },
    ];
    api.get.mockResolvedValueOnce({ data: anunciosMock });

    render(
      <MemoryRouter>
        <AnuncioBanner />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Mantenimiento programado")).toBeTruthy();
    });
    expect(screen.getByText("Aviso importante")).toBeTruthy();
    expect(screen.getByText("Hoy a las 20:00")).toBeTruthy();
  });

  it("permite descartar anuncios no-persistentes", async () => {
    const anunciosMock = [
      { id: 1, titulo: "Anuncio normal", mensaje: "Mensaje normal", tipo: "info" },
    ];
    api.get.mockResolvedValueOnce({ data: anunciosMock });

    render(
      <MemoryRouter>
        <AnuncioBanner />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Anuncio normal")).toBeTruthy();
    });

    const closeBtn = screen.getByText("Cerrar");
    fireEvent.click(closeBtn);

    expect(screen.queryByText("Anuncio normal")).toBeNull();
  });

  it("no permite descartar anuncios persistentes (maintenance)", async () => {
    const anunciosMock = [
      { id: 1, titulo: "Mantencion", mensaje: "Mensaje mantencion", tipo: "maintenance" },
    ];
    api.get.mockResolvedValueOnce({ data: anunciosMock });

    render(
      <MemoryRouter>
        <AnuncioBanner />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Mantencion")).toBeTruthy();
    });

    const btn = screen.getByText("Obligatorio");
    fireEvent.click(btn);

    // Debe seguir estando presente
    expect(screen.getByText("Mantencion")).toBeTruthy();
  });

  it("maneja errores silenciosamente al fallar la API", async () => {
    api.get.mockRejectedValueOnce(new Error("API Fail"));
    const { container } = render(
      <MemoryRouter>
        <AnuncioBanner />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    });
    expect(container.firstChild).toBeNull();
  });
});
