// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { DataCacheProvider, useDataCache } from "./DataCacheContext";

vi.mock("../api", () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock("./AuthContext", () => ({
  useAuth: () => ({ user: { id: 1 }, loading: false }),
  AuthProvider: ({ children }) => children,
}));

import api from "../api";

function TestComponent() {
  const { cursos, estudiantes, fetchEstudiantes, fetchCursos } = useDataCache();
  return (
    <div>
      <button data-testid="load" onClick={() => { fetchEstudiantes(); fetchCursos(); }}>
        Load
      </button>
      <div data-testid="estudiantes-count">{estudiantes.length}</div>
      <div data-testid="cursos-count">{cursos.length}</div>
    </div>
  );
}

describe("DataCacheContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("carga estudiantes y cursos desde la API al hacer clic", async () => {
    api.get.mockImplementation((url) => {
      if (url === "/estudiantes") return Promise.resolve({ data: [{ id: 1, nombre: "Juan" }] });
      if (url === "/cursos") return Promise.resolve({ data: [{ id: 1, nombre: "1A" }] });
      return Promise.reject(new Error("not found"));
    });

    render(
      <DataCacheProvider>
        <TestComponent />
      </DataCacheProvider>,
    );

    fireEvent.click(screen.getByTestId("load"));

    await waitFor(() => {
      expect(screen.getByTestId("estudiantes-count").textContent).toBe("1");
    });

    expect(screen.getByTestId("cursos-count").textContent).toBe("1");
    expect(api.get).toHaveBeenCalledTimes(2);
  });
});
