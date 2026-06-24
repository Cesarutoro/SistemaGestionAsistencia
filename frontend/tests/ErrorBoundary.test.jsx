// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ErrorBoundary from "../src/components/ErrorBoundary";

const ProblematicComponent = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error("Test Throw Error");
  }
  return <div>Componente Correcto</div>;
};

describe("ErrorBoundary component", () => {
  let consoleSpy;

  beforeEach(() => {
    // Evitar polución de logs de error esperados en consola
    consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("renderiza children si no hay errores", () => {
    render(
      <ErrorBoundary>
        <ProblematicComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Componente Correcto")).toBeTruthy();
  });

  it("captura errores y muestra el fallback de error", () => {
    render(
      <ErrorBoundary>
        <ProblematicComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Algo salió mal")).toBeTruthy();
    expect(screen.getByText("Test Throw Error")).toBeTruthy();
    expect(screen.getByText("Recargar página")).toBeTruthy();
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("recarga la página al presionar el botón", () => {
    // Mock location reload
    const originalLocation = window.location;
    delete window.location;
    window.location = { reload: vi.fn() };

    render(
      <ErrorBoundary>
        <ProblematicComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    const reloadBtn = screen.getByText("Recargar página");
    fireEvent.click(reloadBtn);

    expect(window.location.reload).toHaveBeenCalled();

    // Restaurar
    window.location = originalLocation;
  });
});
