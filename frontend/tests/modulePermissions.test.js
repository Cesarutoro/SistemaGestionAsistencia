import { describe, expect, test } from "vitest";
import {
  canAccessModule,
  canManageModule,
  getDefaultPermissionsForRole,
  getDefaultPermissionEntriesForRole,
  getLandingRoute,
  normalizePermissions,
  normalizePermissionEntries,
  samePermissions,
  resolvePermissionsForRole,
} from "../src/utils/modulePermissions";

describe("modulePermissions", () => {
  test("normaliza permisos invalidos y duplicados", () => {
    expect(normalizePermissions(["dashboard", "dashboard", "cursos", "x"])).toEqual([
      "dashboard",
      "cursos",
    ]);
  });

  test("normaliza permisos con lectura", () => {
    expect(
      normalizePermissionEntries([
        { clave: "dashboard", readOnly: true },
        { clave: "dashboard", readOnly: false },
        { clave: "cursos" },
      ]),
    ).toEqual([
      { clave: "dashboard", readOnly: true },
      { clave: "cursos", readOnly: false },
    ]);
  });

  test("retorna permisos por defecto del rol", () => {
    expect(getDefaultPermissionsForRole("inspector")).toEqual([
      "dashboard",
      "asistencia",
      "atrasos",
      "salidas-anticipadas",
      "estudiantes",
    ]);
    expect(getDefaultPermissionEntriesForRole("inspector")).toEqual([
      { clave: "dashboard", readOnly: false },
      { clave: "asistencia", readOnly: false },
      { clave: "atrasos", readOnly: false },
      { clave: "salidas-anticipadas", readOnly: false },
      { clave: "estudiantes", readOnly: false },
    ]);
  });

  test("detecta acceso por permiso de modulo", () => {
    expect(
      canAccessModule({ rol: "inspector", permisos: [{ clave: "cursos", readOnly: true }] }, "cursos"),
    ).toBe(true);
    expect(
      canAccessModule({ rol: "inspector", permisos: [{ clave: "cursos", readOnly: true }] }, "atrasos"),
    ).toBe(false);
  });

  test("distingue permisos editables de solo lectura", () => {
    expect(
      canManageModule({ rol: "inspector", permisos: [{ clave: "cursos", readOnly: true }] }, "cursos"),
    ).toBe(false);
    expect(
      canManageModule({ rol: "inspector", permisos: [{ clave: "cursos", readOnly: false }] }, "cursos"),
    ).toBe(true);
  });

  test("devuelve la primera ruta accesible", () => {
    expect(getLandingRoute({ rol: "inspector", permisos: [{ clave: "cursos", readOnly: true }] })).toBe("/cursos");
    expect(getLandingRoute({ rol: "admin", permisos: [] })).toBe("/dashboard");
    expect(getLandingRoute(null)).toBe("/dashboard");
    expect(getLandingRoute({ rol: "inspector", permisos: [] })).toBe("/dashboard");
  });

  test("compara permisos de forma identica (samePermissions)", () => {
    expect(samePermissions(["dashboard", "asistencia"], ["asistencia", "dashboard"])).toBe(true);
    expect(samePermissions(["dashboard"], ["asistencia"])).toBe(false);
    expect(samePermissions(["dashboard"], ["dashboard", "asistencia"])).toBe(false);
  });

  test("resuelve permisos para rol (resolvePermissionsForRole)", () => {
    expect(resolvePermissionsForRole("admin", [])).toHaveLength(6);
    expect(resolvePermissionsForRole("inspector", [{ clave: "asistencia", readOnly: true }])).toEqual([
      { clave: "asistencia", readOnly: true }
    ]);
    expect(resolvePermissionsForRole("inspector", [])).toHaveLength(5);
  });

  test("canAccessModule y canManageModule con valores nulos o admin", () => {
    expect(canAccessModule(null, "dashboard")).toBe(false);
    expect(canAccessModule({ rol: "admin" }, "dashboard")).toBe(true);
    expect(canManageModule(null, "dashboard")).toBe(false);
    expect(canManageModule({ rol: "admin" }, "dashboard")).toBe(true);
  });
});
