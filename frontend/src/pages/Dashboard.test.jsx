// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import Dashboard from "./Dashboard";

vi.mock("../api", () => ({
  apiDashboard: {
    obtenerResumen: vi.fn(),
  },
}));

import { apiDashboard } from "../api";

describe("Dashboard page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza métricas y rankings solicitados", async () => {
    apiDashboard.obtenerResumen.mockResolvedValueOnce({
      fecha: "2026-03-13",
      total_estudiantes: 100,
      atrasos_hoy: 7,
      estudiantes_3mas_atrasos_semana: [
        {
          estudiante_id: 1,
          nombre: "Ana",
          apellido: "Pérez",
          curso_nombre: "1A",
          total_atrasos: 4,
        },
      ],
      ranking_cursos_semana: [
        { curso_id: 1, curso_nombre: "1A", total_atrasos: 10 },
      ],
      ranking_cursos_mes: [
        { curso_id: 2, curso_nombre: "2B", total_atrasos: 25 },
      ],
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Total Estudiantes")).toBeTruthy();
    });

    expect(screen.getByText("Atrasos de Hoy")).toBeTruthy();
    expect(
      screen.getByText("Estudiantes con 3+ atrasos en la semana"),
    ).toBeTruthy();
    expect(
      screen.getByText("Ranking cursos con más atrasos (Semana)"),
    ).toBeTruthy();
    expect(
      screen.getByText("Ranking cursos con más atrasos (Mes)"),
    ).toBeTruthy();
    expect(screen.getByText("Pérez, Ana")).toBeTruthy();
  });
});
