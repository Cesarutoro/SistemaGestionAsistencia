// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { ToastProvider, useToast } from "../src/context/ToastContext";

const Trigger = () => {
  const toast = useToast();
  return (
    <div>
      <button onClick={() => toast.success("Guardado correctamente")}>
        Lanzar Success
      </button>
      <button onClick={() => toast.error("Error al guardar")}>
        Lanzar Error
      </button>
      <button onClick={() => toast.info("Informacion general")}>
        Lanzar Info
      </button>
    </div>
  );
};

const BadConsumer = () => {
  useToast();
  return <div>Malo</div>;
};

describe("ToastContext", () => {
  it("muestra toast cuando se dispara success, error o info", async () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("Lanzar Success"));
    expect(screen.getByText("Guardado correctamente")).toBeTruthy();

    fireEvent.click(screen.getByText("Lanzar Error"));
    expect(screen.getByText("Error al guardar")).toBeTruthy();

    fireEvent.click(screen.getByText("Lanzar Info"));
    expect(screen.getByText("Informacion general")).toBeTruthy();
  });

  it("permite cerrar un toast manualmente con el boton X", async () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("Lanzar Success"));
    const toastMessage = screen.getByText("Guardado correctamente");
    expect(toastMessage).toBeTruthy();

    const closeBtn = screen.getByLabelText("Cerrar toast");
    fireEvent.click(closeBtn);

    expect(screen.queryByText("Guardado correctamente")).toBeNull();
  });

  it("elimina el toast automaticamente despues de la duracion especificada", async () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("Lanzar Success"));
    expect(screen.getByText("Guardado correctamente")).toBeTruthy();

    // Avanzar el tiempo 3000ms
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.queryByText("Guardado correctamente")).toBeNull();
    vi.useRealTimers();
  });

  it("lanza un error si useToast se usa fuera del proveedor", () => {
    // Silenciar error en consola
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    
    expect(() => render(<BadConsumer />)).toThrow("useToast debe usarse dentro de ToastProvider");
    
    consoleSpy.mockRestore();
  });
});
