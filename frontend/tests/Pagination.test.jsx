// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Pagination from "../src/components/Pagination";

describe("Pagination component", () => {
  it("no renderiza cuando totalItems <= pageSize", () => {
    const onPageChange = vi.fn();
    const { container } = render(
      <Pagination
        currentPage={1}
        totalItems={10}
        pageSize={10}
        onPageChange={onPageChange}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renderiza páginas y dispara cambio", () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        currentPage={1}
        totalItems={25}
        pageSize={10}
        onPageChange={onPageChange}
      />,
    );

    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();

    fireEvent.click(screen.getByText("2"));
    expect(onPageChange).toHaveBeenCalledWith(2);

    fireEvent.click(screen.getByText("Siguiente"));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
