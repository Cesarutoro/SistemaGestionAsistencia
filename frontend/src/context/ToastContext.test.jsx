// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ToastProvider, useToast } from "./ToastContext";

const Trigger = () => {
  const toast = useToast();
  return (
    <button onClick={() => toast.success("Guardado correctamente")}>
      Lanzar
    </button>
  );
};

describe("ToastContext", () => {
  it("muestra toast cuando se dispara success", () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("Lanzar"));
    expect(screen.getByText("Guardado correctamente")).toBeTruthy();
  });
});
