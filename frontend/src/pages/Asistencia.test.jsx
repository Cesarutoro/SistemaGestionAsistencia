// @vitest-environment jsdom
import React from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import Asistencia from "./Asistencia";

const apiMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("../api", () => ({
  default: {
    get: apiMocks.get,
    post: apiMocks.post,
    put: apiMocks.put,
    delete: apiMocks.delete,
  },
}));

let authState = { user: null, loading: false };
const toastMock = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
};

vi.mock("../context/AuthContext", () => ({
  useAuth: () => authState,
}));

vi.mock("../context/ToastContext", () => ({
  useToast: () => toastMock,
}));

describe("Asistencia page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState = { user: null, loading: false };
  });

  test("no consulta cursos hasta que haya sesión", async () => {
    render(<Asistencia />);

    await waitFor(() => {
      expect(apiMocks.get).not.toHaveBeenCalled();
    });
  });

  test("consulta cursos cuando la sesión ya está lista", async () => {
    authState = { user: { rol: "inspector", permisos: [{ clave: "asistencia", readOnly: false }] }, loading: false };
    apiMocks.get.mockResolvedValueOnce({ data: [{ id: 1, nombre: "1 básico A" }] });
    apiMocks.get.mockResolvedValue({ data: [] });

    render(<Asistencia />);

    await waitFor(() => {
      expect(apiMocks.get).toHaveBeenCalledWith("/cursos");
    });
  });
});