export const MODULES = [
  { clave: "dashboard", nombre: "Panel general", route: "/dashboard" },
  { clave: "asistencia", nombre: "Registro diario", route: "/asistencia" },
  { clave: "atrasos", nombre: "Control de atrasos", route: "/atrasos" },
  {
    clave: "salidas-anticipadas",
    nombre: "Salidas anticipadas",
    route: "/salidas-anticipadas",
  },
  { clave: "estudiantes", nombre: "Base de estudiantes", route: "/estudiantes" },
  { clave: "cursos", nombre: "Cursos y niveles", route: "/cursos" },
];

export const MODULE_KEYS = MODULES.map((module) => module.clave);

export const ROLE_DEFAULT_PERMISSIONS = {
  admin: [...MODULE_KEYS],
  director: [...MODULE_KEYS],
  inspector: [
    "dashboard",
    "asistencia",
    "atrasos",
    "salidas-anticipadas",
    "estudiantes",
  ],
};

export function normalizePermissions(input) {
  if (!Array.isArray(input)) {
    return [];
  }

  return [...new Set(input.map((value) => {
    if (typeof value === "string") {
      return String(value).trim();
    }

    if (value && typeof value === "object") {
      return String(value.clave || value.permission || value.moduleKey || "").trim();
    }

    return "";
  }).filter((value) => MODULE_KEYS.includes(value)))];
}

export function normalizePermissionEntries(input) {
  if (!Array.isArray(input)) {
    return [];
  }

  const seen = new Set();
  const entries = [];

  for (const value of input) {
    const clave = typeof value === "string"
      ? String(value).trim()
      : String(value?.clave || value?.permission || value?.moduleKey || "").trim();

    if (!MODULE_KEYS.includes(clave) || seen.has(clave)) {
      continue;
    }

    seen.add(clave);
    const readOnly = typeof value === "object" && value !== null
      ? Boolean(value.readOnly ?? value.soloLectura ?? value.read_only ?? false)
      : false;

    entries.push({ clave, readOnly });
  }

  return entries;
}

export function getDefaultPermissionsForRole(role) {
  if (!role) {
    return [];
  }

  return [...(ROLE_DEFAULT_PERMISSIONS[role] || [])];
}

export function samePermissions(left, right) {
  const normalizedLeft = normalizePermissions(left);
  const normalizedRight = normalizePermissions(right);

  if (normalizedLeft.length !== normalizedRight.length) {
    return false;
  }

  return normalizedLeft.every((permission) => normalizedRight.includes(permission));
}

export function resolvePermissionsForRole(role, permissions) {
  if (role === "admin") {
    return MODULE_KEYS.map((clave) => ({ clave, readOnly: false }));
  }

  const normalized = normalizePermissionEntries(permissions);
  return normalized.length > 0 ? normalized : getDefaultPermissionEntriesForRole(role);
}

export function getDefaultPermissionEntriesForRole(role) {
  return getDefaultPermissionsForRole(role).map((clave) => ({ clave, readOnly: false }));
}

export function canAccessModule(user, moduleKey) {
  if (!user || !moduleKey) {
    return false;
  }

  if (user.rol === "admin") {
    return true;
  }

  const permissions = normalizePermissions(user.permisos || user.permissions || []);
  return permissions.includes(moduleKey);
}

export function canManageModule(user, moduleKey) {
  if (!user || !moduleKey) {
    return false;
  }

  if (user.rol === "admin") {
    return true;
  }

  const currentPermissions = normalizePermissionEntries(user.permisos || user.permissions || []);
  const permission = currentPermissions.find((entry) => entry.clave === moduleKey);

  return Boolean(permission) && !permission.readOnly;
}

export function getLandingRoute(user) {
  if (!user) {
    return "/dashboard";
  }

  const accessOrder = ["dashboard", "asistencia", "atrasos", "salidas-anticipadas", "estudiantes", "cursos"];

  for (const moduleKey of accessOrder) {
    if (canAccessModule(user, moduleKey)) {
      return MODULES.find((module) => module.clave === moduleKey)?.route || "/dashboard";
    }
  }

  return "/dashboard";
}