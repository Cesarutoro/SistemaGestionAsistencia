// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { DataCacheProvider, useDataCache } from "../src/context/DataCacheContext";

vi.mock("../src/api", () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock("../src/context/AuthContext", () => ({
  useAuth: () => ({ user: { id: 1 }, loading: false }),
  AuthProvider: ({ children }) => children,
}));

import api from "../src/api";

function TestComponent() {
  const { cursos, estudiantes, fetchEstudiantes, fetchCursos, clearCache } = useDataCache();
  return (
    <div>
      <button data-testid="load" onClick={() => { fetchEstudiantes(); fetchCursos(); }}>
        Load
      </button>
      <button data-testid="clear" onClick={clearCache}>
        Clear
      </button>
      <div data-testid="estudiantes-count">{estudiantes.length}</div>
      <div data-testid="cursos-count">{cursos.length}</div>
    </div>
  );
}

const BadConsumer = () => {
  useDataCache();
  return <div>Malo</div>;
};

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

  it("maneja errores de la API al cargar estudiantes y cursos", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    api.get.mockRejectedValue({ response: { status: 500 } });

    render(
      <DataCacheProvider>
        <TestComponent />
      </DataCacheProvider>,
    );

    fireEvent.click(screen.getByTestId("load"));

    await waitFor(() => {
      expect(screen.getByTestId("estudiantes-count").textContent).toBe("0");
    });
    expect(screen.getByTestId("cursos-count").textContent).toBe("0");
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("limpia el cache correctamente al llamar a clearCache", async () => {
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

    fireEvent.click(screen.getByTestId("clear"));

    expect(screen.getByTestId("estudiantes-count").textContent).toBe("0");
    expect(screen.getByTestId("cursos-count").textContent).toBe("0");
  });

  it("lanza un error si useDataCache se usa fuera del proveedor", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<BadConsumer />)).toThrow("useDataCache debe usarse dentro de un DataCacheProvider");
    consoleSpy.mockRestore();
  });
});
