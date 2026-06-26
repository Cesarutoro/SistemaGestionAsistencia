// @vitest-environment jsdom
import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import {
  CardSkeleton,
  TableSkeleton,
  ChartSkeleton,
  FilterSkeleton,
  SkeletonBar,
} from "../src/components/LoadingSkeleton";

describe("LoadingSkeleton components", () => {
  it("renderiza SkeletonBar con propiedades personalizadas", () => {
    const { container } = render(<SkeletonBar width="80%" height={20} />);
    const bar = container.firstChild;
    expect(bar.style.width).toBe("80%");
    expect(bar.style.height).toBe("20px");
  });

  it("renderiza CardSkeleton correctamente", () => {
    const { container } = render(<CardSkeleton />);
    expect(container.querySelector(".card")).toBeTruthy();
    expect(container.querySelectorAll(".skeleton-pulse").length).toBeGreaterThan(0);
  });

  it("renderiza TableSkeleton con filas y columnas especificadas", () => {
    const { container } = render(<TableSkeleton rows={4} cols={3} />);
    expect(container.querySelector(".card")).toBeTruthy();
    // 4 filas + header
    const rows = container.querySelectorAll("div[style*='display: grid']");
    expect(rows.length).toBe(4);
    // Cada fila debe tener 3 celdas
    const cells = rows[0].children;
    expect(cells.length).toBe(3);
  });

  it("renderiza ChartSkeleton correctamente", () => {
    const { container } = render(<ChartSkeleton />);
    expect(container.querySelector(".card")).toBeTruthy();
    // 8 barras en el gráfico
    const barsContainer = container.querySelector("div[style*='display: flex']");
    expect(barsContainer.children.length).toBe(8);
  });

  it("renderiza FilterSkeleton correctamente", () => {
    const { container } = render(<FilterSkeleton />);
    expect(container.querySelector(".card")).toBeTruthy();
    const filterGrid = container.querySelector("div[style*='display: grid']");
    expect(filterGrid.children.length).toBe(2);
  });
});
